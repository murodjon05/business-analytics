# BitoAnalyst

AI-powered ERP business analysis application using Cerebras LLM.

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

## Architecture

- **Backend:** Django 5 + Django REST Framework
- **Frontend:** React + Vite + Tailwind CSS
- **Database:** PostgreSQL
- **Message Queue:** Redis + Celery
- **AI:** Cerebras LLM API

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

## API Endpoints

- `POST /api/analyze/` - Submit ERP data for analysis
- `GET /api/results/<id>/` - Get analysis results
- `GET /api/analyses/` - List all analyses

## AI Analysis Pipeline

1. **Data Quality Analysis** - Identifies red flags and anomalies
2. **Business Strategy** - Top 5 problems with root causes and actions
3. **ERP Configuration** - Specific Bito ERP module recommendations