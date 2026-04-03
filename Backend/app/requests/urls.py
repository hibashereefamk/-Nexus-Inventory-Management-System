from django.urls import path
from .views import ApprovalViewSet

urlpatterns = [
    path('/api/approvals/<int:pk>/decide/', ApprovalViewSet.as_view(), name='admin-stats'),
]