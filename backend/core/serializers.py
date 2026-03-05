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
            'business_strategy', 'cleaning_analysis', 'erp_actions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnalysisRequestSerializer(serializers.Serializer):
    """Serializer for incoming data analysis requests."""
    name = serializers.CharField(required=False, allow_blank=True)
    payload = serializers.JSONField(required=False)
    raw_data = serializers.JSONField(required=False)
    sales = serializers.DictField(required=False)
    warehouse = serializers.DictField(required=False)
    finance = serializers.DictField(required=False)
    crm = serializers.DictField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("No data provided")
        return attrs
