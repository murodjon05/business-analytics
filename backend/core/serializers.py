from rest_framework import serializers
from .models import ErpSnapshot, AnalysisResult

class ErpSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ErpSnapshot
        fields = ['id', 'raw_data', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnalysisResultSerializer(serializers.ModelSerializer):
    erp_snapshot = ErpSnapshotSerializer(read_only=True)
    
    class Meta:
        model = AnalysisResult
        fields = [
            'id', 'erp_snapshot', 'status', 'name', 'error_message',
            'cleaning_analysis', 'business_strategy', 'erp_actions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnalysisRequestSerializer(serializers.Serializer):
    """Serializer for incoming ERP data analysis requests."""
    name = serializers.CharField(required=False, allow_blank=True)
    raw_data = serializers.JSONField(required=False)
    sales = serializers.DictField(required=False)
    warehouse = serializers.DictField(required=False)
    finance = serializers.DictField(required=False)
    crm = serializers.DictField(required=False)

    def validate(self, data):
        # Accept flexible schemas; if nothing provided, reject.
        if not data:
            raise serializers.ValidationError("No data provided for analysis.")
        return data
