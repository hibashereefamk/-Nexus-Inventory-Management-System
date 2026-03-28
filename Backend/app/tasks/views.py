from django.shortcuts import render
from .serilaizers import OrderAssignmentSerilializer,OrderItemseriliazer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics,permissions
from app.accounts.permissions import IsManager,IsStaffFromDepartment
from .models import OrderAssignment,OrderItem

class ManagerCreateAssignmentView(generics.CreateAPIView):
    
    serializer_class = OrderAssignmentSerilializer
    permission_classes = [permissions.IsAuthenticated, IsManager] 

    def perform_create(self, serializer):
        serializer.save(manager=self.request.user, department=self.request.user.department)

class StaffDashboardTasksView(generics.ListAPIView):
   
    serializer_class = OrderAssignmentSerilializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(
            staff=self.request.user, 
            department=self.request.user.department
        ).order_by('status', 'deadline_date')


