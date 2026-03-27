from rest_framework import generics, permissions
from rest_framework.views import APIView
from .models import Product
from app.inventory.seriliazers import ShipmentTask
from .seriliazers import ShipmentTaskSerializer,ProductSerializer

class ManagerAssignmentView(generics.CreateAPIView):
    serializer_class = ShipmentTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(manager=self.request.user)

class StaffTaskListView(generics.ListAPIView):
    serializer_class = ShipmentTaskSerializer

    def get_queryset(self):
        user = self.request.user
        return ShipmentTask.objects.filter(staff_assigned=user, department=user.department)
    
class Productview(APIView):
    serializer = ProductSerializer