from django.contrib import admin
from .models import OrderAssignment,OrderItem

admin.site.register(OrderAssignment,OrderItem)

