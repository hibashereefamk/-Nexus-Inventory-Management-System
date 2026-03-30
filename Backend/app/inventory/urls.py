from django.urls import path
from .views import Productview,IssueReportCreateView,ManagerIssueListView

urlpatterns = [
    path('products/',Productview.as_view(),name='product_viwe'),
    path('products/<int:pk>/', Productview.as_view(), name='product-detail'),
    path('report-issue/', IssueReportCreateView.as_view(), name='report-issue'),
    path('manager/pending-issues/', ManagerIssueListView.as_view(), name='manager-issues'),
    
]

