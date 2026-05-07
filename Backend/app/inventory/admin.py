from django.contrib import admin
from .models import Product,Category,IssueReport,Notification


admin.site.register(Product)
admin.site.register(Category)
admin.site.register(IssueReport)
admin.site.register(Notification)

