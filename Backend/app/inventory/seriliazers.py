from rest_framework import serializers
from .models import Product,Category,IssueReport,Notification

class ProductSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    is_urgent = serializers.BooleanField(source='is_low_stock', read_only=True)

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
        model =IssueReport
        fields = [
            'id', 'product', 'product_name', 'reported_by_name', 
            'type', 'cause', 'description', 'urgency', 
            'is_reviewed_by_manager', 'created_at'
        ]
        read_only_fields = ['reported_by', 'department', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model =Notification
        fields ='__all__'



