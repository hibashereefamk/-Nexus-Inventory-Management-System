# app/orders/serializers.py
from rest_framework import serializers
from .models import OrderAssignment, OrderItem
from app.inventory.models import Product
from app.accounts.models import Department
from rest_framework.exceptions import ValidationError

# 1. Dedicated serializer for the Product "Card"
class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category_name']



class DepartmentManagerSerializer(serializers.ModelSerializer):
    staff = serializers.CharField(source='manager.username')
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'slug', 'manager','staff']
from rest_framework import serializers
from django.db import transaction

class OrderConfirmationSerializer(serializers.ModelSerializer):
    """Used by Admin to move Order from DRAFT to CONFIRMED and create Assignment."""
    class Meta:
        model = OrderItem
        fields = ['id', 'status', 'target_department']
        read_only_fields = ['id']

    def update(self, instance, validated_data):
        if instance.status != 'DRAFT':
            raise serializers.ValidationError("Only Draft orders can be confirmed.")

        with transaction.atomic():
            instance.status = 'CONFIRMED'
            instance.save()

            # Create the assignment for the Manager to see
            # 'request.user' is the Admin/Manager confirming the order
            OrderAssignment.objects.create(
                order=instance,
                department=instance.target_department,
                manager=self.context['request'].user, 
                status='PENDING'
            )
        return instance
class OrderItemSerializer(serializers.ModelSerializer):
    # This allows the frontend to see the FULL product info
    product_details = ProductDetailSerializer(source='product', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product','status','target_department', 'product_details', 'order_number','quantity', 'is_inspected']

# 3. The main Serializer for the Dashboard
class OrderAssignmentSerializer(serializers.ModelSerializer):
    # 'items' must match the 'related_name' in your OrderItem model
    items = OrderItemSerializer(many=True, read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    staff_username = serializers.CharField(source='staff.username', read_only=True)
    order_number =serializers.CharField(source='order.order_number')

    class Meta:
        model = OrderAssignment
        fields = [
            'id',  'status', 'department', 'department_name','order', 'order_number',
            'staff', 'staff_username', 'deadline_date', 'items', 'assigned_at'
        ]

class AssignOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAssignment
        fields = ['staff', 'priority', 'deadline_date']

    def validate(self, data):
        staff = data.get('staff')
        # The 'instance' here is the OrderAssignment object
        assignment = self.instance 

        if staff:
            # PROFESSIONAL CHECK:
            # Ensure the selected staff member belongs to the order's target department
            if staff.department != assignment.department:
                raise serializers.ValidationError(
                    f"Invalid Staff. This order is for {assignment.department.name}, "
                    f"but {staff.username} belongs to {staff.department.name}."
                )
            
            # Ensure the user being assigned has the 'staff' role
            if staff.role != 'staff':
                raise serializers.ValidationError("Only users with the 'Staff' role can be assigned tasks.")

        return data
    



class ManagerDashboardSerializer(serializers.ModelSerializer):
    # Get the order details nested inside
    order_details = OrderItemSerializer(source='order', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    staff_name = serializers.CharField(source='staff.username', read_only=True)

    class Meta:
        model = OrderAssignment
        fields = [
            'id', 'order_details', 'department_name', 
            'staff', 'staff_name', 'status', 'priority', 'deadline_date'
        ]

class UpdateStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAssignment
        fields = ['status']