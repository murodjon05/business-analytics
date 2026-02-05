# BitoAnalyst Backend

## Setup

1. Create `.env` file:
```
CEREBRAS_API_KEY=your_cerebras_api_key_here
DJANGO_SECRET_KEY=your-secret-key-here
```

2. Build and run:
```bash
docker-compose up --build
```

3. Access:
- Backend API: http://localhost:8000/api/
- Frontend: http://localhost:5173
- Admin: http://localhost:8000/admin

## API Endpoints

- `POST /api/analyze/` - Submit ERP data for analysis
- `GET /api/results/<id>/` - Get analysis results