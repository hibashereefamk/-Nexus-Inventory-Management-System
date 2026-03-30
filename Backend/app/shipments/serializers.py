from rest_framework import serializers
from .models import ShipmentTask
from app.inventory.seriliazers import ProductSerializer

class ShipmentTaskSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = ShipmentTask
        fields = '__all__'