from django.db import models
from django.utils import timezone
from app.accounts.models import User

class ApprovalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('more_info', 'Requested More Info'), # New State
    ]
    
    PRIORITY_CHOICES = [
        ('1', 'Low'), ('2', 'Normal'), ('3', 'High'), ('4', 'Critical')
    ]

    # Identity
    title = models.CharField(max_length=200)
    request_type = models.CharField(max_length=50, default='GENERAL')
    priority = models.CharField(max_length=1, choices=PRIORITY_CHOICES, default='2')
    
    # Relationships
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    department = models.ForeignKey('inventory.Department', on_delete=models.SET_NULL, null=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')

    # Content & Audit
    content = models.TextField()
    rejection_reason = models.TextField(null=True, blank=True) # Essential for ERP
    attachment = models.FileField(upload_to='approvals/%Y/%m/', null=True, blank=True)
    
    # Status & Logistics
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def decide(self, user, decision, reason=None):
        """Professional decision method with timestamping"""
        self.status = decision
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        if decision == 'rejected':
            self.rejection_reason = reason
        self.save()

    @property
    def lead_time(self):
        """Calculates how long the manager took to approve"""
        if self.reviewed_at:
            return self.reviewed_at - self.created_at
        return timezone.now() - self.created_at

    def __str__(self):
        return f"[{self.get_priority_display()}] {self.title} - {self.status}"