from rest_framework import serializers
from .models import ShipmentTask

class ShipmentTaskSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    department_name = serializers.ReadOnlyField(source='department.name')

    class __all__:
        model = ShipmentTask
        fields = '__all__'