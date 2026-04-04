# app/orders/serializers.py
from rest_framework import serializers
from .models import OrderAssignment, OrderItem
from app.inventory.models import Product

# 1. Dedicated serializer for the Product "Card"
class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category_name']

# 2. Serializer for the items in the order
class OrderItemSerializer(serializers.ModelSerializer):
    # This allows the frontend to see the FULL product info
    product_details = ProductDetailSerializer(source='product', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_details', 'quantity', 'is_inspected']

# 3. The main Serializer for the Dashboard
class OrderAssignmentSerializer(serializers.ModelSerializer):
    # 'items' must match the 'related_name' in your OrderItem model
    items = OrderItemSerializer(many=True, read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    staff_username = serializers.CharField(source='staff.username', read_only=True)

    class Meta:
        model = OrderAssignment
        fields = [
            'id', 'order_number', 'status', 'department', 'department_name', 
            'staff', 'staff_username', 'deadline_date', 'items', 'assigned_at'
        ]
    
class UpdateStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAssignment
        fields = ['status']