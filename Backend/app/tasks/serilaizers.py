# app/orders/serializers.py
from rest_framework import serializers
from .models import OrderAssignment, OrderItem
from app.inventory.models import Product,Category
from app.accounts.models import Department
from rest_framework.exceptions import ValidationError

# 1. Dedicated serializer for the Product "Card"
class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category_name','expiry_date',
                  'warranty_expiry','total_stock','department', 
            'bin_location','batch_number','committed_stock', 'status']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

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
    product_details = ProductDetailSerializer(source='product', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id','order_number','product',
            'product_details','quantity','status',
            'target_department', 'rejection_reason', 'created_at','updated_at',
        ]

class OrderAssignmentSerializer(serializers.ModelSerializer):
    order_details = OrderItemSerializer(source='order', read_only=True)

    department_name = serializers.CharField(source='department.name', read_only=True)
    staff_username = serializers.CharField(source='staff.username', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = OrderAssignment
        fields = [
            'id','status','department','department_name','verification_status',
            'priority','order','order_number','order_details','staff',
            'staff_username','issue_status', 'is_cancelled','deadline_date',
            'assigned_at', 'completed_at','manager','approval_status',
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