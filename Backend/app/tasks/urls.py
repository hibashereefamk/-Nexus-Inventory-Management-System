from .views import (StaffDashboardTasksView,ManagerCreateAssignmentView,ManagerDashboardStats,StaffUpdateTaskStatusView,StaffTaskDetailView,TaskStatsView,StaffTaskInspectView)
from django.urls import path

# Backend/app/tasks/urls.py

urlpatterns = [
    path('staff/tasks/', StaffDashboardTasksView.as_view(), name='staff-dashboard'),
    path('staff/tasks/<int:pk>/', StaffTaskDetailView.as_view(), name='task-detail'), 
    path('manager/create-assignment/', ManagerCreateAssignmentView.as_view(), name='manager-dashboard'),
    path('staff/update-task/<int:pk>/', StaffUpdateTaskStatusView.as_view(), name='update-task'),
    path('staff/tasks/<int:pk>/inspect/', StaffTaskInspectView.as_view(), name='task-inspect'),
    path('staff/stats/', TaskStatsView.as_view(), name='staff-stats'),
    path('manager/dashboard/',ManagerDashboardStats.as_view(),name='manager-dashboard')
]