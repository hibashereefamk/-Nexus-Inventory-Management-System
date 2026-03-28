from rest_framework import generics, permissions
from rest_framework.views import APIView
from .models import Product
from rest_framework.response import Response
from rest_framework import status
from app.inventory.seriliazers import ShipmentTask
from app.accounts.permissions import IsManager,IsStaffFromDepartment,IsSuperAdmin
from .seriliazers import ShipmentTaskSerializer,ProductSerializer
from django.utils import timezone

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
    serializer_class = ProductSerializer
    def get_permissions(self):
        if self.request.method =='POST' or self.request.method =='DELETE' :
            return [IsManager]
        return [IsStaffFromDepartment]
    
    def get(self, request, pk=None):
        if pk:
            product = Product.objects.get(pk=pk)
            serializer = ProductSerializer(product)
            return Response(serializer.data)
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        if serializer.data.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        product = Product.objects.get(pk=pk)
        data = request.data
        
        if data.get('status') == 'PACKED':
            product.assigned_at = timezone.now()
        
        if data.get('status') == 'FLAGGED':
            if not data.get('damage_notes'):
                return Response({"error": "You must provide damage notes to flag an item."}, 
                                status=status.HTTP_400_BAD_REQUEST)

        if data.get('status') == 'SHIPPED':
            quantity = int(data.get('quantity_to_ship', product.quantity_to_ship))
            if product.total_stock < quantity:
                return Response({"error": "Not enough stock to ship!"}, status=status.HTTP_400_BAD_REQUEST)
            
            product.total_stock -= quantity
            product.shipped_date = timezone.now()

        serializer = ProductSerializer(product, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)