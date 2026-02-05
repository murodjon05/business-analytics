FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Run migrations then start gunicorn (demo-friendly)
CMD ["sh", "-c", "python manage.py migrate && gunicorn bitoanalyst.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
