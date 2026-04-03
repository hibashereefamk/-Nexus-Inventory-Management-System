from .models import ApprovalRequest
from rest_framework import serializers

class ApprovalRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = ApprovalRequest
        fields = '__all__'