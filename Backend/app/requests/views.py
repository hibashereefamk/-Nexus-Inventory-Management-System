from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ApprovalRequest
from .serilaizers import ApprovalRequestSerializer

class ApprovalViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.all().order_by('-created_at')
    serializer_class = ApprovalRequestSerializer

    @action(detail=True, methods=['post'], url_path='decide')
    def decide(self, request, pk=None):
        approval_item = self.get_object()
        decision = request.data.get('decision') # 'approved' or 'rejected'
        
        if decision not in ['approved', 'rejected']:
            return Response({'error': 'Invalid decision'}, status=status.HTTP_400_BAD_REQUEST)
        
        approval_item.status = decision
        approval_item.reviewed_by = request.user
        approval_item.save()
        
        log_event(
        user=request.user, 
        action=f"Changed Request #{approval_item.id} status to {decision}", 
        request=request
    )
    
        return Response({'status': 'Action logged and saved'})