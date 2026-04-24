from rest_framework import serializers
from .models import Product,Category,IssueReport,Notification

class ProductSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    is_urgent = serializers.BooleanField(source='is_low_stock', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    class Meta:
        model = Product
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model =Category
        fields ='__all__'



class IssueReportserializer(serializers.ModelSerializer):
    reported_by_name = serializers.CharField(source='reported_by.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = IssueReport
        fields = [
            'id', 'product', 'product_name', 'reported_by_name', 
            'type', 'cause', 'description', 'urgency', 'is_emergency',
            'is_reviewed_by_manager', 'created_at'
        ]
        read_only_fields = ['reported_by', 'department', 'created_at']

    def validate(self, data):
        # Match 'type' instead of 'issue_type'
        issue_type = data.get('type')
        product = data.get('product')
        
        if product.total_stock <= 0 and issue_type != 'LOST':
            raise serializers.ValidationError("Cannot report damage/expiry on items with zero stock.")
        return data

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model =Notification
        fields ='__all__'



