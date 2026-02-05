from django.db import models

class ErpSnapshot(models.Model):
    """Stores raw ERP data from different modules."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    raw_data = models.JSONField(
        help_text="Raw ERP data including Sales, Warehouse, Finance, CRM"
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"ERP Snapshot {self.id} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class AnalysisResult(models.Model):
    """Stores AI analysis results for an ERP snapshot."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    erp_snapshot = models.OneToOneField(
        ErpSnapshot,
        on_delete=models.CASCADE,
        related_name='analysis'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    name = models.CharField(max_length=120, blank=True, default='')
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # AI Analysis Outputs
    cleaning_analysis = models.JSONField(
        default=dict,
        help_text="Data quality analysis and red flags"
    )
    business_strategy = models.JSONField(
        default=dict,
        help_text="Top 5 problems, root causes, and actions"
    )
    erp_actions = models.JSONField(
        default=dict,
        help_text="Specific Bito ERP module configuration changes"
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Analysis {self.id} - {self.get_status_display()}"
