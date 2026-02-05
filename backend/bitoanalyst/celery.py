"""
Celery configuration for bitoanalyst project.
"""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bitoanalyst.settings')

app = Celery('bitoanalyst')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# This will make sure the app is always imported when Django starts
# so that shared_task will use this app.
__all__ = ['app']