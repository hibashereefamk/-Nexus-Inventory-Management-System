from rest_framework import serializers
from .models import ApprovalRequest

class ApprovalRequestSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.ReadOnlyField(source='submitted_by.get_full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = [
            'id', 'title', 'request_type', 'priority', 'priority_display',
            'submitted_by', 'submitted_by_name', 'department', 'content', 
            'attachment', 'status', 'status_display', 'rejection_reason',
            'created_at', 'reviewed_at', 'lead_time'
        ]
        read_only_fields = ['status', 'submitted_by', 'reviewed_by', 'reviewed_at']