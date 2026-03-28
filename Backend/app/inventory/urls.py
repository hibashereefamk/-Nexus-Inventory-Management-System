from django.urls import path
from .views import StaffTaskListView,Productview,ManagerAssignmentView

urlpatterns = [
    path('mngr-product-create/',ManagerAssignmentView.as_view(),name='manager-create'),
    path('products/',Productview.as_view(),name='product_viwe'),
    path('staff-view/',StaffTaskListView.as_view(),name='staff-view'),
]

