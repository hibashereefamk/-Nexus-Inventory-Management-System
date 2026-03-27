from django.db import models
from app.accounts.models import User,Department


class Category(models.Model):
    name =models.CharField(max_length=100)
    discription =models.TextField()

    def __str__(self):
        return self.name

class Product(models.Model):
    name= models.CharField(max_length=200 ,blank=True,null=True)
    
    Department=models.CharField(Department,)

    
