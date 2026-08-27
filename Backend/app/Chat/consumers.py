import json

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Conversation, ConversationMember, Message


class ChatConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):

        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.conversation_id = self.scope["url_route"]["kwargs"][
            "conversation_id"
        ]

        self.room_group_name = (
            f"chat_{self.conversation_id}"
        )

        # Check membership
        is_member = await self.check_membership()

        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive_json(self, content, **kwargs):

        message_text = content.get("message")

        if not message_text:
            return

        message = await self.create_message(
            message_text
        )

        await self.channel_layer.group_send(

            self.room_group_name,

            {
                "type": "chat_message",

                "message_id": message["id"],

                "conversation_id":
                    message["conversation_id"],

                "sender_id":
                    message["sender_id"],

                "sender_name":
                    message["sender_name"],

                "message":
                    message["content"],

                "message_type":
                    message["message_type"],

                "created_at":
                    message["created_at"],
            }
        )

    async def chat_message(self, event):

        await self.send_json({

            "type": "message",

            "id":
                event["message_id"],

            "conversation":
                event["conversation_id"],

            "sender":
                event["sender_id"],

            "sender_name":
                event["sender_name"],

            "message_type":
                event["message_type"],

            "content":
                event["message"],

            "created_at":
                event["created_at"],
        })

    @database_sync_to_async
    def check_membership(self):

        return ConversationMember.objects.filter(
            conversation_id=self.conversation_id,
            user=self.user
        ).exists()

    @database_sync_to_async
    def create_message(self, content):

        message = Message.objects.create(

            conversation_id=self.conversation_id,

            sender=self.user,

            message_type="TEXT",

            content=content
        )

        return {
            "id": message.id,

            "conversation_id":
                message.conversation_id,

            "sender_id":
                message.sender_id,

            "sender_name":
                message.sender.username,

            "content":
                message.content,

            "message_type":
                message.message_type,

            "created_at":
                message.created_at.isoformat(),
        }