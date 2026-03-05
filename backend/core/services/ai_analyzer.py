import json
import logging
from cerebras.cloud.sdk import Cerebras
from django.conf import settings

logger = logging.getLogger(__name__)

class AIAnalyzer:
    """Service for analyzing business data using Cerebras LLM."""
    
    def __init__(self):
        self.client = Cerebras(api_key=settings.CEREBRAS_API_KEY)
        self.model = "gpt-oss-120b"

    def _normalize_data(self, data):
        """Ensure data is a dict for prompting; wrap non-dicts."""
        if isinstance(data, dict):
            return self._aggregate_large_data(data)
        return {"raw_data": data}
    
    def _aggregate_large_data(self, data, max_items=500):
        """Aggregate large arrays to prevent LLM token limits."""
        if not isinstance(data, dict):
            return data
        
        aggregated = {}
        for key, value in data.items():
            if isinstance(value, list) and len(value) > max_items:
                if len(value) > 0 and isinstance(value[0], dict):
                    sample = value[:max_items]
                    aggregated[key] = {
                        "_sample": sample,
                        "_total_count": len(value),
                        "_note": f"Showing {max_items} of {len(value)} rows. Data aggregated for analysis."
                    }
                else:
                    aggregated[key] = value[:max_items]
            else:
                aggregated[key] = value
        
        return aggregated
    
    def _infer_schema(self, data):
        """Infer the schema structure from the uploaded data."""
        if isinstance(data, list):
            if len(data) > 0 and isinstance(data[0], dict):
                return self._infer_schema({"rows": data})
            return {"type": "array", "fields": []}
        if not isinstance(data, dict):
            return {"type": "unknown", "fields": []}
        
        schema = {
            "top_level_keys": list(data.keys()),
            "fields": {},
            "numeric_fields": [],
            "categorical_fields": [],
            "detected_categories": []
        }
        
        def analyze_value(key, value, path=""):
            field_path = f"{path}.{key}" if path else key
            
            if isinstance(value, dict):
                schema["fields"][field_path] = {
                    "type": "object",
                    "children": {}
                }
                for child_key, child_value in value.items():
                    analyze_value(child_key, child_value, field_path)
            elif isinstance(value, list):
                schema["fields"][field_path] = {
                    "type": "array",
                    "length": len(value)
                }
                if len(value) > 0:
                    if isinstance(value[0], dict):
                        schema["fields"][field_path]["item_type"] = "object"
                        for child_key in value[0].keys():
                            sample_value = value[0][child_key]
                            analyze_value(child_key, sample_value, field_path)
                    elif isinstance(value[0], (int, float, str)):
                        schema["fields"][field_path]["sample_value"] = value[0]
            elif isinstance(value, (int, float)):
                schema["fields"][field_path] = {
                    "type": "number",
                    "value": value
                }
                schema["numeric_fields"].append(field_path)
            elif isinstance(value, str):
                schema["fields"][field_path] = {
                    "type": "string",
                    "value": value
                }
                if '%' in value:
                    try:
                        schema["fields"][field_path]["parsed_number"] = float(value.replace('%', ''))
                        schema["numeric_fields"].append(field_path)
                    except:
                        pass
            elif isinstance(value, bool):
                schema["fields"][field_path] = {
                    "type": "boolean",
                    "value": value
                }
        
        for key, value in data.items():
            analyze_value(key, value)
        
        for key in data.keys():
            if isinstance(data[key], dict):
                schema["detected_categories"].append(key)
        
        return schema
    
    def _calculate_dynamic_ratios(self, data, schema):
        """Dynamically calculate ratios based on detected numeric fields."""
        if not isinstance(data, dict):
            return {}
        
        ratios = {}
        
        def get_numeric_value(obj, path):
            keys = path.split('.')
            value = obj
            for key in keys:
                if isinstance(value, dict) and key in value:
                    value = value[key]
                else:
                    return None
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                try:
                    return float(value.replace('%', '').replace(',', ''))
                except:
                    return None
            return None
        
        numeric_fields = schema.get("numeric_fields", [])
        
        for i, field_a in enumerate(numeric_fields):
            val_a = get_numeric_value(data, field_a)
            if val_a is None or val_a == 0:
                continue
            
            for field_b in numeric_fields[i+1:]:
                val_b = get_numeric_value(data, field_b)
                if val_b is None or val_b == 0:
                    continue
                
                ratio_name = f"{field_a}_to_{field_b}_ratio"
                ratios[ratio_name] = (val_b / val_a) * 100 if val_a != 0 else 0
        
        for key, value in data.items():
            if isinstance(value, list) and len(value) > 0 and isinstance(value[0], dict):
                all_numeric = {}
                for row in value:
                    if not isinstance(row, dict):
                        continue
                    for field_name, field_value in row.items():
                        if isinstance(field_value, (int, float)):
                            if field_name not in all_numeric:
                                all_numeric[field_name] = []
                            all_numeric[field_name].append(float(field_value))
                
                for field_name, values in all_numeric.items():
                    if len(values) > 0:
                        total = sum(values)
                        avg = total / len(values)
                        ratios[f"{key}.{field_name}.sum"] = total
                        ratios[f"{key}.{field_name}.avg"] = avg
                        ratios[f"{key}.{field_name}.count"] = len(values)
        
        def calculate_totals(obj, prefix=""):
            totals = {}
            if isinstance(obj, dict):
                for key, value in obj.items():
                    field_name = f"{prefix}.{key}" if prefix else key
                    if isinstance(value, (int, float)):
                        totals[field_name] = value
                    elif isinstance(value, dict):
                        nested = calculate_totals(value, field_name)
                        for k, v in nested.items():
                            totals[k] = v
            return totals
        
        totals = calculate_totals(data)
        if totals:
            ratios["totals"] = totals
        
        return ratios
    
    def _call_llm(self, system_prompt, user_prompt, temperature=0.3):
        """Make an LLM call to Cerebras."""
        try:
            logger.info("Calling Cerebras API...")
            
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.model,
                temperature=temperature,
                stream=False
            )
            
            logger.info(f"Response type: {type(response)}")
            logger.info(f"Response: {response}")
            
            if hasattr(response, 'choices') and len(response.choices) > 0:
                content = response.choices[0].message.content
                logger.info(f"Content: {content[:200]}...")
            else:
                logger.error(f"Unexpected response structure: {response}")
                raise ValueError("Invalid response from Cerebras API")
            
            if not content or content.strip() == '':
                raise ValueError("Empty response from Cerebras API")
            
            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                logger.error(f"Content: {content}")
                if '```json' in content:
                    json_str = content.split('```json')[1].split('```')[0].strip()
                    return json.loads(json_str)
                elif '```' in content:
                    json_str = content.split('```')[1].split('```')[0].strip()
                    return json.loads(json_str)
                raise
                
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            raise
    
    def generate_business_strategy(self, data):
        """
        Generate business strategy based on data analysis.
        Returns top problems with root causes and actions.
        """
        schema = self._infer_schema(data)
        dynamic_ratios = self._calculate_dynamic_ratios(data, schema)
        
        normalized_data = self._normalize_data(data)

        system_prompt = """You are a senior business strategist. Analyze the provided business data to identify key problems, opportunities, and recommend actionable strategies.

The data schema is dynamic - users can upload any JSON/CSV dataset. You must:
1. Infer the business context from the field names and values provided
2. Identify the most important metrics and their relationships
3. Calculate meaningful ratios and comparisons on your own
4. Provide business insights relevant to the detected data categories
5. ALWAYS include key_metrics - extract all numeric fields from the data as key_metrics

Respond ONLY with a valid JSON object in this exact format:
{
    "executive_summary": "2-3 sentence summary of overall business health",
    "detected_data_types": ["list of detected business areas like sales, marketing, inventory, etc."],
    "key_metrics": {
        "metric_name": numeric_value,
        "another_metric": numeric_value
    },
    "top_problems": [
        {
            "rank": 1-5,
            "problem": "Clear problem statement",
            "category": "inferred business category",
            "root_cause": "Detailed explanation of why this is happening",
            "financial_impact": "Estimated impact in currency or percentage",
            "recommended_action": "Specific, actionable step",
            "action_priority": "critical|high|medium|low",
            "estimated_effort": "hours|days|weeks",
            "expected_roi": "percentage or currency estimate"
        }
    ],
    "opportunities": [
        {
            "title": "Opportunity title",
            "description": "Detailed description",
            "potential_impact": "Estimated benefit",
            "effort_required": "low|medium|high"
        }
    ],
    "quick_wins": [
        {
            "action": "Quick action description",
            "impact": "expected outcome",
            "effort": "low"
        }
    ],
    "strategic_initiatives": [
        {
            "initiative": "Long-term initiative name",
            "description": "Description",
            "timeline": "1-3 months|3-6 months|6-12 months",
            "expected_impact": "Description"
        }
    ]
}"""
        
        user_prompt = f"""Analyze this business data and provide strategic insights:

Data Schema:
{json.dumps(schema, indent=2)}

Raw Data:
{json.dumps(normalized_data, indent=2)}

Calculated Ratios:
{json.dumps(dynamic_ratios, indent=2)}

IMPORTANT: Include key_metrics with ALL numeric fields from the data. This is required for the dashboard to display metrics.

Provide your strategy as JSON. Make reasonable inferences about business context from field names and values."""
        
        return self._call_llm(system_prompt, user_prompt, temperature=0.4)
    
    def run_full_analysis(self, data):
        """Run the complete AI analysis chain."""
        logger.info("Generating business strategy...")
        business_strategy = self.generate_business_strategy(data)

        return {
            'business_strategy': business_strategy,
            'schema_info': self._infer_schema(self._normalize_data(data))
        }
