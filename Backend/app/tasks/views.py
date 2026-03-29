from django.shortcuts import render
from .serilaizers import OrderAssignmentSerializer,UpdateStatusSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics,permissions
from app.accounts.permissions import IsManager,IsStaffFromDepartment
from .models import OrderAssignment,OrderItem
from django.utils import timezone

class ManagerCreateAssignmentView(generics.CreateAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]

    def perform_create(self, serializer):
        staff = serializer.validated_data.get('staff')

        serializer.save(
            manager=self.request.user,
            department=staff.department
        )


class StaffDashboardTasksView(generics.ListAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(
            staff=self.request.user
        ).order_by('status', 'deadline_date')


class StaffUpdateTaskStatusView(generics.UpdateAPIView):
    serializer_class = UpdateStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user)

    def perform_update(self, serializer):
        status_value = self.request.data.get("status")

        if status_value == "SHIPPED":
            serializer.save(
                status=status_value,
                completed_at=timezone.now()
            )
        else:
            serializer.save(status=status_value)