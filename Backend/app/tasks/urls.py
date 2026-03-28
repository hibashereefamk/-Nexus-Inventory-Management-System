from .views import (StaffDashboardTasksView,ManagerCreateAssignmentView,StaffUpdateTaskStatusView)
from django.urls import path

urlpatterns = [
    path('staff/tasks/',StaffDashboardTasksView.as_view(),name='staff-dashboard'),
    path('manager/create-assignment/',ManagerCreateAssignmentView.as_view(),name='manager-dashboard'),
    path('staff/update-task/<int:pk>/', StaffUpdateTaskStatusView.as_view(), name='update-task'),
]
