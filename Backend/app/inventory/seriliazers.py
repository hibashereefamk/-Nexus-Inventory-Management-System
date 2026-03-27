from rest_framework import serializers
from .models import Product
from app.inventory.seriliazers import ShipmentTask

class ProductSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    is_urgent = serializers.BooleanField(source='is_low_stock', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class ShipmentTaskSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = ShipmentTask
        fields = '__all__'