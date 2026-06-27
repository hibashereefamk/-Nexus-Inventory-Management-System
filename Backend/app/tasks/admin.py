from django.contrib import admin
from .models import OrderAssignment,OrderItem,Customer

admin.site.register(OrderAssignment)
admin.site.register(OrderItem)
admin.site.register(Customer)

