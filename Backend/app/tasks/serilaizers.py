from app.accounts.models import User, Department
from .models import OrderAssignment,OrderItem
from rest_framework import serializers

class OrderAssignmentSerilializer(serializers.ModelSerializer):

    class Meta:
        model =OrderAssignment
        fields='__all__'

class OrderItemseriliazer(serializers.ModelSerializer):

    class Meta:
        model =OrderItem
        fields = OrderItem
        

