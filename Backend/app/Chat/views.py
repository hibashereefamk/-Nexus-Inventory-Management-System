from django.contrib.auth import get_user_model
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction


from .models import Conversation, ConversationMember,Message
from .serializers import (
    ConversationSerializer,
    EmployeeSearchSerializer,
    MesaageSerializer
)


User = get_user_model()


class ConversationListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        conversations = (
            Conversation.objects
            .filter(
                members__user=request.user
            )
            .prefetch_related(
                "members__user"
            )
            .distinct()
            .order_by("-updated_at")
        )

        serializer = ConversationSerializer(
            conversations,
            many=True
        )

        return Response(serializer.data)

class EmployeeSearchView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        search = request.query_params.get(
            "search",
            ""
        ).strip()

        users = User.objects.filter(
            is_active=True,
            is_deleted=False
        ).exclude(
            id=request.user.id
        )

        if search:

            users = users.filter(

                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)

            )

        users = users.select_related(
            "department"
        )[:20]

        serializer = EmployeeSearchSerializer(
            users,
            many=True
        )

        return Response(
            serializer.data
        )







class CreateDirectConversationView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        current_user = request.user

        target_user_id = request.data.get(
            "user_id"
        )

        if not target_user_id:

            return Response(
                {
                    "detail": "user_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if str(target_user_id) == str(
            current_user.id
        ):

            return Response(
                {
                    "detail": "You cannot chat with yourself."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            target_user = User.objects.get(
                id=target_user_id,
                is_active=True,
                is_deleted=False
            )

        except User.DoesNotExist:

            return Response(
                {
                    "detail": "Employee not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Find existing direct chat
        existing_conversation = (
            Conversation.objects
            .filter(
                conversation_type="DIRECT",
                members__user=current_user
            )
            .filter(
                members__user=target_user
            )
            .distinct()
            .first()
        )

        if existing_conversation:

            serializer = ConversationSerializer(
                existing_conversation,
                context={
                    "request": request
                }
            )

            return Response(
                {
                    "created": False,
                    "conversation": serializer.data
                },
                status=status.HTTP_200_OK
            )

        # Create new conversation
        with transaction.atomic():

            conversation = Conversation.objects.create(

                conversation_type="DIRECT",

                created_by=current_user,

                name=None

            )

            ConversationMember.objects.bulk_create([

                ConversationMember(
                    conversation=conversation,
                    user=current_user
                ),

                ConversationMember(
                    conversation=conversation,
                    user=target_user
                )

            ])

        serializer = ConversationSerializer(

            conversation,

            context={
                "request": request
            }

        )

        return Response(
            {
                "created": True,
                "conversation": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class MessageHistoryView()