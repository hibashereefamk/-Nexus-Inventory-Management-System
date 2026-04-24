from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ApprovalRequest
from .serilaizers import ApprovalRequestSerializer

class ApprovalRequestViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.all()
    serializer_class = ApprovalRequestSerializer

    def perform_create(self, serializer):
        """Automatically set the user who is logged in as the submitter"""
        serializer.save(submitted_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Custom endpoint: /api/approvals/{id}/approve/"""
        approval_request = self.get_object()
        approval_request.decide(user=request.user, decision='approved')
        return Response({'status': 'Request approved'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Custom endpoint: /api/approvals/{id}/reject/"""
        approval_request = self.get_object()
        reason = request.data.get('reason')
        
        if not reason:
            return Response({'error': 'Reason is required for rejection'}, status=status.HTTP_400_BAD_REQUEST)
            
        approval_request.decide(user=request.user, decision='rejected', reason=reason)
        return Response({'status': 'Request rejected'}, status=status.HTTP_200_OK)