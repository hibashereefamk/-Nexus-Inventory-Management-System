from .views import (StaffDashboardTasksView,ManagerCreateAssignmentView,StaffUpdateTaskStatusView,StaffTaskDetailView,StaffTaskInspectView)
from django.urls import path

# Backend/app/tasks/urls.py

urlpatterns = [
    path('staff/tasks/', StaffDashboardTasksView.as_view(), name='staff-dashboard'),
    
    # ADD THIS LINE to fix the 404 error
    path('staff/tasks/<int:pk>/', StaffTaskDetailView.as_view(), name='task-detail'), 
    
    path('manager/create-assignment/', ManagerCreateAssignmentView.as_view(), name='manager-dashboard'),
    path('staff/update-task/<int:pk>/', StaffUpdateTaskStatusView.as_view(), name='update-task'),
    
    # You will also eventually need this for your submitInspection function:
    path('staff/tasks/<int:pk>/inspect/', StaffTaskInspectView.as_view(), name='task-inspect'),
]