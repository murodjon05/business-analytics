from django.contrib import admin
from .models import ErpSnapshot, AnalysisResult

@admin.register(ErpSnapshot)
class ErpSnapshotAdmin(admin.ModelAdmin):
    list_display = ['id', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['id']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'erp_snapshot', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at']
    search_fields = ['id', 'erp_snapshot__id']
    readonly_fields = ['created_at', 'updated_at']
    
    def has_add_permission(self, request):
        return False