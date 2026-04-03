from django.db import models
from app.accounts.models import User

class ApprovalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    title = models.CharField(max_length=200)
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    content = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    created_at = models.DateTimeField(auto_now_add=True)

    def approve(self, user):
        self.status = 'approved'
        self.reviewed_by = user
        self.save()