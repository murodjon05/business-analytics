import os
import json
import logging
from cerebras.cloud.sdk import Cerebras
from django.conf import settings

logger = logging.getLogger(__name__)

class AIAnalyzer:
    """Service for analyzing ERP data using Cerebras LLM."""
    
    def __init__(self):
        self.client = Cerebras(api_key=settings.CEREBRAS_API_KEY)
        self.model = "gpt-oss-120b"

    def _normalize_erp_data(self, erp_data):
        """Ensure ERP data is a dict for prompting; wrap non-dicts."""
        if isinstance(erp_data, dict):
            return erp_data
        return {"raw_data": erp_data}
    
    def _calculate_ratios(self, erp_data):
        """Pre-calculate key business ratios from ERP data."""
        if not isinstance(erp_data, dict):
            return {}
        sales = erp_data.get('sales', {})
        warehouse = erp_data.get('warehouse', {})
        finance = erp_data.get('finance', {})
        crm = erp_data.get('crm', {})
        
        ratios = {}
        
        # Sales ratios
        total_orders = sales.get('total_orders', 0)
        cancelled = sales.get('cancelled', 0)
        ratios['cancellation_rate'] = (cancelled / total_orders * 100) if total_orders > 0 else 0
        ratios['aov'] = sales.get('aov', 0)
        repeat_str = sales.get('repeat', '0%')
        ratios['repeat_rate'] = float(repeat_str.replace('%', '')) if isinstance(repeat_str, str) else repeat_str
        
        # Warehouse ratios
        skus = warehouse.get('skus', 0)
        out_of_stock = warehouse.get('out_of_stock', 0)
        dead_stock = warehouse.get('dead_stock', 0)
        ratios['stockout_rate'] = (out_of_stock / skus * 100) if skus > 0 else 0
        ratios['dead_stock_rate'] = (dead_stock / skus * 100) if skus > 0 else 0
        
        # Finance ratios
        revenue = finance.get('revenue', 0)
        expenses = finance.get('expenses', 0)
        profit = finance.get('profit', 0)
        ratios['net_profit_margin'] = (profit / revenue * 100) if revenue > 0 else 0
        ratios['expense_ratio'] = (expenses / revenue * 100) if revenue > 0 else 0
        
        # CRM ratios
        leads = crm.get('leads', 0)
        converted = crm.get('converted', 0)
        lost = crm.get('lost', 0)
        ratios['conversion_rate'] = (converted / leads * 100) if leads > 0 else 0
        ratios['loss_rate'] = (lost / leads * 100) if leads > 0 else 0
        
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
            
            # Handle the response properly
            if hasattr(response, 'choices') and len(response.choices) > 0:
                content = response.choices[0].message.content
                logger.info(f"Content: {content[:200]}...")
            else:
                logger.error(f"Unexpected response structure: {response}")
                raise ValueError("Invalid response from Cerebras API")
            
            if not content or content.strip() == '':
                raise ValueError("Empty response from Cerebras API")
            
            # Try to parse as JSON
            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                logger.error(f"Content: {content}")
                # Try to extract JSON if wrapped in markdown code blocks
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
    
    def analyze_data_quality(self, erp_data):
        """
        Analyze data quality and detect abnormal ratios.
        Returns structured JSON with red flags and insights.
        """
        normalized_data = self._normalize_erp_data(erp_data)
        ratios = self._calculate_ratios(normalized_data)
        
        system_prompt = """You are an expert ERP data analyst. Analyze the provided ERP data and ratios to identify data quality issues, anomalies, and business red flags. The data may be provided in standard ERP modules or in arbitrary metric tables; make reasonable inferences and note assumptions.

Respond ONLY with a valid JSON object in this exact format:
{
    "red_flags": [
        {
            "severity": "high|medium|low",
            "category": "sales|warehouse|finance|crm|operations|general",
            "metric": "metric name",
            "value": numeric_value,
            "threshold": benchmark_value,
            "description": "Clear explanation of the issue"
        }
    ],
    "key_insights": [
        {
            "category": "sales|warehouse|finance|crm|operations|general",
            "title": "Brief insight title",
            "description": "Detailed insight description",
            "impact": "high|medium|low"
        }
    ],
    "data_quality_score": 0-100,
    "summary": "Brief overall assessment"
}

Severity thresholds:
- Cancellation rate > 15% = high, > 10% = medium
- Stockout rate > 10% = high, > 5% = medium
- Dead stock rate > 20% = high, > 15% = medium
- Net profit margin < 5% = high, < 10% = medium
- Conversion rate < 15% = high, < 20% = medium"""
        
        user_prompt = f"""Analyze this ERP data and pre-calculated ratios:

Raw Data:
{json.dumps(normalized_data, indent=2)}

Calculated Ratios:
{json.dumps(ratios, indent=2)}

Provide your analysis as JSON."""
        
        return self._call_llm(system_prompt, user_prompt)
    
    def generate_business_strategy(self, erp_data, cleaning_insights):
        """
        Generate business strategy based on data analysis.
        Returns top 5 problems with root causes and actions.
        """
        normalized_data = self._normalize_erp_data(erp_data)

        system_prompt = """You are a senior business strategist. Based on the ERP data and data quality insights, identify the top 5 business problems, their root causes, and recommended actions. The ERP data may be a generic metric table; infer business context as needed and state assumptions.

Respond ONLY with a valid JSON object in this exact format:
{
    "executive_summary": "2-3 sentence summary of overall business health",
    "top_problems": [
        {
            "rank": 1-5,
            "problem": "Clear problem statement",
            "category": "sales|warehouse|finance|crm|operations|general",
            "root_cause": "Detailed explanation of why this is happening",
            "financial_impact": "Estimated monthly/quarterly impact in currency",
            "recommended_action": "Specific, actionable step",
            "action_priority": "critical|high|medium|low",
            "estimated_effort": "hours|days|weeks",
            "expected_roi": "percentage or currency estimate"
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
        
        user_prompt = f"""Generate business strategy based on:

ERP Data:
{json.dumps(normalized_data, indent=2)}

Data Quality Insights:
{json.dumps(cleaning_insights, indent=2)}

Provide your strategy as JSON."""
        
        return self._call_llm(system_prompt, user_prompt, temperature=0.4)
    
    def generate_erp_config(self, business_strategy):
        """
        Generate specific Bito ERP module configuration changes.
        Returns actionable ERP settings grouped by module.
        """
        system_prompt = """You are a Bito ERP configuration expert. Based on the business strategy analysis, suggest specific ERP module settings and configurations to address the identified problems.

Respond ONLY with a valid JSON object in this exact format:
{
    "configuration_summary": "Overview of recommended changes",
    "modules": {
        "sales": {
            "priority": "high|medium|low",
            "configurations": [
                {
                    "setting": "Specific setting name/path",
                    "current_value": "Current setting (estimate)",
                    "recommended_value": "New setting value",
                    "rationale": "Why this change helps",
                    "implementation_difficulty": "easy|medium|hard"
                }
            ],
            "automations": [
                {
                    "automation": "Automation name",
                    "trigger": "What triggers it",
                    "action": "What it does",
                    "benefit": "Expected benefit"
                }
            ]
        },
        "warehouse": {
            "priority": "high|medium|low",
            "configurations": [...],
            "automations": [...]
        },
        "finance": {
            "priority": "high|medium|low",
            "configurations": [...],
            "automations": [...]
        },
        "crm": {
            "priority": "high|medium|low",
            "configurations": [...],
            "automations": [...]
        }
    },
    "integration_changes": [
        {
            "integration": "Integration name",
            "change": "Description of change",
            "modules_affected": ["module1", "module2"],
            "impact": "Description of impact"
        }
    ],
    "implementation_order": [
        {
            "step": 1,
            "module": "module name",
            "action": "What to implement",
            "estimated_time": "hours/days",
            "prerequisites": ["prereq1", "prereq2"]
        }
    ]
}"""
        
        user_prompt = f"""Generate Bito ERP configuration recommendations based on:

Business Strategy:
{json.dumps(business_strategy, indent=2)}

Provide configuration as JSON."""
        
        return self._call_llm(system_prompt, user_prompt, temperature=0.3)
    
    def run_full_analysis(self, erp_data):
        """Run the complete AI analysis chain."""
        logger.info("Starting data quality analysis...")
        cleaning_analysis = self.analyze_data_quality(erp_data)

        logger.info("Generating business strategy...")
        business_strategy = self.generate_business_strategy(erp_data, cleaning_analysis)

        logger.info("Generating ERP configuration...")
        erp_actions = self.generate_erp_config(business_strategy)

        return {
            'cleaning_analysis': cleaning_analysis,
            'business_strategy': business_strategy,
            'erp_actions': erp_actions
        }
