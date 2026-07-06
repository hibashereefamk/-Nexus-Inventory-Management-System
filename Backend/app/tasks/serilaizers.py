# app/orders/serializers.py

from decimal import Decimal

from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import Customer, OrderAssignment, OrderItem
from app.inventory.models import Product, Category
from app.accounts.models import Department


# ==========================================================
# PRODUCT / CATEGORY SERIALIZERS
# ==========================================================

class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(
        source="category.name"
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category_name",
            "expiry_date",
            "warranty_expiry",
            "total_stock",
            "department",
            "bin_location",
            "batch_number",
            "committed_stock",
            "status",
        ]


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
        ]


class DepartmentManagerSerializer(serializers.ModelSerializer):
    staff = serializers.CharField(
        source="manager.username",
        read_only=True
    )

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "slug",
            "manager",
            "staff",
        ]


# ==========================================================
# ORDER CONFIRMATION
# ==========================================================

class OrderConfirmationSerializer(serializers.ModelSerializer):
    """
    Admin confirms order:
    DRAFT → CONFIRMED
    Creates OrderAssignment automatically
    """

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "status",
            "target_department",
        ]
        read_only_fields = ["id"]

    def update(self, instance, validated_data):

        if instance.status != "DRAFT":
            raise ValidationError(
                "Only draft orders can be confirmed."
            )

        with transaction.atomic():

            instance.status = "CONFIRMED"
            instance.save()

            OrderAssignment.objects.create(
                order=instance,
                department=instance.target_department,
                manager=self.context["request"].user,
                status="PENDING",
            )

        return instance


# ==========================================================
# ORDER ITEM
# ==========================================================

class OrderItemSerializer(serializers.ModelSerializer):

    product_details = ProductDetailSerializer(
        source="product",
        read_only=True,
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "order_number",
            "product",
            "product_details",
            "quantity",
            "status",
            "target_department",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]


# ==========================================================
# ORDER ASSIGNMENT
# ==========================================================

class OrderAssignmentSerializer(serializers.ModelSerializer):

    order_items = OrderItemSerializer(
    source="order.orderitem_set",
    many=True,
    read_only=True,
)

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    staff_username = serializers.CharField(
        source="staff.username",
        read_only=True
    )

    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True
    )

    class Meta:
        model = OrderAssignment
        fields = [
            "id",
            "status",
            "department",
            "department_name",
            "verification_status",
            "priority",
            "order",
            "order_number",
            "order_items",
            "staff",
            "staff_username",
            "issue_status",
            "is_cancelled",
            "deadline_date",
            "assigned_at",
            "completed_at",
            "manager",
            "approval_status",
        ]

 

class AssignOrderSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderAssignment
        fields = [
            "staff",
            "priority",
            "deadline_date",
        ]

    def validate(self, data):

        staff = data.get("staff")
        assignment = self.instance

        if not staff:
            return data

        # Validate department
        if staff.department != assignment.department:
            raise ValidationError(
                {
                    "staff": (
                        f"{staff.username} belongs to "
                        f"{staff.department.name}. "
                        f"Expected {assignment.department.name}."
                    )
                }
            )

        # Validate role
        if staff.role != "staff":
            raise ValidationError(
                {
                    "staff":
                    "Only users with STAFF role can be assigned."
                }
            )

        return data


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'shipping_address', 'tax_number']

class OrderItemSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), write_only=True, required=False, allow_null=True)
    product_details = ProductDetailSerializer(source='product', read_only=True)
    customer_details = CustomerSerializer(source='customer', read_only=True)
    tax_calculation = serializers.SerializerMethodField()
    payment_credit_details = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'order_number', 'product', 'product_details', 'quantity','customer', 'customer_details', 
            'status', 'target_department', 'rejection_reason', 'created_at', 'updated_at',
             'tax_calculation', 'payment_credit_details' 
        ]

    def get_customer_details(self, obj):
        if obj.customer:
            return {
                "name": obj.customer.name,
                "email": obj.customer.email,          
                "phone": obj.customer.phone,          
                "shipping_address": obj.customer.shipping_address, 
                "tax_number": obj.customer.tax_number or "N/A"     
            }
        return None
        

    def get_tax_calculation(self, obj):
        product_price = getattr(obj.product, 'price', Decimal("0.00")) 
        subtotal = obj.quantity * product_price
        
        tax_rate = Decimal("18.00") 
        tax_amount = (subtotal * tax_rate) / Decimal("100")
        grand_total = subtotal + tax_amount

        return {
            "unit_price": float(product_price),
            "subtotal": float(subtotal),
            "tax_rate": "18.00%", 
            "tax_amount": float(tax_amount),
            "grand_total": float(grand_total)
        }

    def get_payment_credit_details(self, obj):
        assignment = obj.order_assignments.first()
        if assignment and assignment.verification_status == 'PASSED':
            p_status = "PAID"
            c_terms = "Immediate Term"
        else:
            p_status = "CREDIT_HOLD"
            c_terms = "Net 30 Days Allowed"

        return {
            "payment_status": p_status,
            "credit_terms": c_terms,
            "is_clear_for_shipping": p_status == "PAID"
        }
class ManagerDashboardSerializer(serializers.ModelSerializer):

    order_details = OrderItemSerializer(
        source="order",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    staff_name = serializers.CharField(
        source="staff.username",
        read_only=True
    )

    class Meta:
        model = OrderAssignment
        fields = [
            "id",
            "order_details",
            "department_name",
            "staff",
            "staff_name",
            "status",
            "priority",
            "deadline_date",
        ]

class UpdateStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderAssignment
        fields = [
            "status",
        ]