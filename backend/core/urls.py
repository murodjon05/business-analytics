from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health, name='health'),
    path('auth/login/', views.login, name='login'),
    path('analyze/', views.analyze_erp_data, name='analyze'),
    path('results/<int:analysis_id>/', views.get_analysis_result, name='result'),
    path('analyses/', views.list_analyses, name='list'),
    path('analyses/<int:analysis_id>/', views.delete_analysis, name='delete'),
]
