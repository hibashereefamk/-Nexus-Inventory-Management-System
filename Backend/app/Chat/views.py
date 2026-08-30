from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from django.db import transaction
from .models import (
    Conversation,
    ConversationMember,
    Message,
)

from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import (
    ConversationSerializer,
    EmployeeSearchSerializer,
    MessageSerializer
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

        # ✅ FIX: Pass the request context here!
        serializer = ConversationSerializer(
            conversations,
            many=True,
            context={"request": request}
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


class MessageHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):

        try:

            conversation = Conversation.objects.get(
                id=conversation_id
            )

        except Conversation.DoesNotExist:

            return Response(
                {
                    "detail": "Conversation not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )


        # Make sure user belongs to conversation

        is_member = ConversationMember.objects.filter(
            conversation=conversation,
            user=request.user
        ).exists()


        if not is_member:

            return Response(
                {
                    "detail": "You are not a member of this conversation."
                },
                status=status.HTTP_403_FORBIDDEN
            )


        messages = (
            Message.objects
            .filter(
                conversation=conversation,
                is_deleted=False
            )
            .select_related("sender")
            .order_by("created_at")
        )


        serializer = MessageSerializer(
            messages,
            many=True,
            context={
                "request": request
            }
        )


        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

class ChatFileUploadView(APIView):

    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser
    ]

    def post(self, request, conversation_id):

        user = request.user

        # ==========================================
        # GET CONVERSATION
        # ==========================================

        conversation = get_object_or_404(
            Conversation,
            id=conversation_id
        )

        # ==========================================
        # CHECK MEMBERSHIP
        # ==========================================

        is_member = ConversationMember.objects.filter(
            conversation=conversation,
            user=user
        ).exists()

        if not is_member:

            return Response(
                {
                    "detail": "You are not a member of this conversation."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ==========================================
        # GET DATA
        # ==========================================

        message_type = request.data.get(
            "message_type"
        )

        uploaded_file = request.FILES.get(
            "file"
        )

        content = request.data.get(
            "content",
            ""
        )

        # ==========================================
        # VALIDATE FILE
        # ==========================================

        if not uploaded_file:

            return Response(
                {
                    "detail": "File is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # VALIDATE MESSAGE TYPE
        # ==========================================

        allowed_types = [
            "IMAGE",
            "VIDEO",
            "FILE",
            "VOICE"
        ]

        if message_type not in allowed_types:

            return Response(
                {
                    "detail": "Invalid message type."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # FILE SIZE
        # ==========================================

        max_size = 50 * 1024 * 1024

        if uploaded_file.size > max_size:

            return Response(
                {
                    "detail": "File size cannot exceed 50 MB."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # CREATE MESSAGE
        # ==========================================

        message = Message.objects.create(

            conversation=conversation,

            sender=user,

            message_type=message_type,

            content=content or None,

            file=uploaded_file,

            file_name=uploaded_file.name,

            file_size=uploaded_file.size
        )

        # ==========================================
        # FILE URL
        # ==========================================

        file_url = request.build_absolute_uri(
            message.file.url
        )

        # ==========================================
        # BROADCAST THROUGH CHANNELS
        # ==========================================

        channel_layer = get_channel_layer()

        async_to_sync(
            channel_layer.group_send
        )(
            f"chat_{conversation.id}",

            {
                "type": "chat_attachment",

                "message_id": message.id,

                "conversation_id": conversation.id,

                "sender_id": user.id,

                "sender_name": user.username,

                "message_type": message.message_type,

                "content": message.content,

                "file_url": file_url,

                "file_name": message.file_name,

                "file_size": message.file_size,

                "created_at": message.created_at.isoformat(),

                "is_edited": message.is_edited,

                "is_deleted": message.is_deleted,
            }
        )

        # ==========================================
        # RESPONSE
        # ==========================================

        serializer = MessageSerializer(
            message,
            context={
                "request": request
            }
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )