# BitoAnalyst

AI-powered business analytics application using Cerebras LLM. Upload any JSON or CSV dataset and get AI-driven business strategy insights.

## Quick Start

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your CEREBRAS_API_KEY
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/
   - Admin Panel: http://localhost:8000/admin

## Features

- **Dynamic Data Processing**: Upload any JSON or CSV dataset - no predefined schema required
- **Real-time Preview**: See data stats and sample rows before analysis
- **500 Row Limit**: Datasets over 500 rows show a warning (prevents token limit issues)
- **AI-Powered Strategy**: Generates business insights tailored to your data structure
- **Flexible Analysis**: Works with sales data, inventory, transactions, or any business metrics

## Architecture

- **Backend:** Django 5 + Django REST Framework
- **Frontend:** React + Vite + Tailwind CSS
- **Database:** PostgreSQL
- **Message Queue:** Redis + Celery
- **AI:** Cerebras LLM API (GPT-OSS 120B)

## Project Structure

```
bitoanalyst/
├── docker-compose.yml
├── backend/
│   ├── bitoanalyst/          # Django project settings
│   ├── core/                 # Main Django app
│   │   ├── models.py         # ErpSnapshot, AnalysisResult
│   │   ├── serializers.py    # DRF serializers
│   │   ├── views.py          # API endpoints
│   │   ├── tasks.py          # Celery tasks
│   │   └── services/         # AI analyzer service
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/       # React components
    │   ├── pages/            # Page components
    │   └── services/         # API service
    ├── package.json
    └── vite.config.js
```

## How It Works

1. **Upload**: User uploads a JSON or CSV file (or pastes JSON directly)
2. **Preview**: See row count, column stats, and sample data instantly
3. **Analyze**: LLM processes the data and generates:
   - Executive summary
   - Top problems with root causes
   - Opportunities
   - Quick wins
   - Strategic initiatives

## Supported Data Formats

- **CSV**: Any comma-separated values file with headers
- **JSON**: Array of objects or nested JSON structures
- **Excel**: .xls and .xlsx files

Example CSV (coffee sales):
```csv
hour_of_day,cash_type,money,coffee_name,Time_of_Day,Weekday
10,card,38.7,Latte,Morning,Fri
12,card,38.7,Hot Chocolate,Afternoon,Fri
```

## API Endpoints

- `POST /api/analyze/` - Submit data for analysis
- `GET /api/results/<id>/` - Get analysis results
- `GET /api/analyses/` - List all analyses
- `DELETE /api/analyses/<id>/` - Delete an analysis

## Limits

- Maximum 500 rows per upload
- Recommended: Under 500 rows for optimal analysis
- Large datasets show a warning before submission
