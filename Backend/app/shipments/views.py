from rest_framework import generics, status
from rest_framework.response import Response
from .models import ShipmentTask
from .serializers import ShipmentTaskSerializer

class CompleteShipmentView(generics.UpdateAPIView):
    queryset = ShipmentTask.objects.all()
    serializer_class = ShipmentTaskSerializer

    def update(self, request, *args, **kwargs):
        shipment = self.get_object()
        dept_name = shipment.department.name.lower()
        data = request.data

        # Department Specific Validation
        if "food" in dept_name and not data.get('is_expiry_checked'):
            return Response({"error": "You must check expiry for food items."}, status=400)
        
        if "furniture" in dept_name and not data.get('is_damage_verified'):
            return Response({"error": "Damage verification required for furniture."}, status=400)

        if "electronics" in dept_name and not data.get('is_warranty_activated'):
            return Response({"error": "Warranty must be activated for electronics."}, status=400)

        # If valid, mark as SHIPPED
        shipment.status = 'SHIPPED'
        shipment.save()
        
        # Update the actual product stock
        product = shipment.product
        product.total_stock -= shipment.quantity_to_ship
        product.status = 'SHIPPED'
        product.save()

        return Response({"message": "Shipment completed and stock updated."})
    
class ShipmentListCreateView(generics.ListCreateAPIView):
    queryset = ShipmentTask.objects.all()
    serializer_class = ShipmentTaskSerializer

    def perform_create(self, serializer):
        serializer.save(department=self.request.user.department)    


class ShipmentDetailView(generics.RetrieveAPIView):
    queryset = ShipmentTask.objects.all()
    serializer_class = ShipmentTaskSerializer 
    def get_queryset(self):
        return ShipmentTask.objects.filter(department=self.request.user.department)       

