from rest_framework import serializers
from .models import OrderAssignment, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity']


class OrderAssignmentSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = OrderAssignment
        fields = [
            'id',
            'manager',
            'staff',
            'department',
            'order_number',
            'status',
            'deadline_date',
            'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = OrderAssignment.objects.create(**validated_data)

        for item in items_data:
            OrderItem.objects.create(
                assignment=order,
                product=item['product'],
                quantity=item['quantity']
            )

        return order
    
class UpdateStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAssignment
        fields = ['status']