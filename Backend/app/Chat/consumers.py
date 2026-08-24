import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Conversation, ConversationMember, Message


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        # Logged-in user
        self.user = self.scope["user"]

        # Conversation ID from URL
        self.conversation_id = self.scope["url_route"]["kwargs"][
            "conversation_id"
        ]

        # Group name
        self.room_group_name = f"chat_{self.conversation_id}"

        # --------------------------------
        # 1. Check authentication
        # --------------------------------

        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        # --------------------------------
        # 2. Check conversation membership
        # --------------------------------

        is_member = await self.check_membership()

        if not is_member:
            await self.close(code=4003)
            return

        # --------------------------------
        # 3. Join Redis channel group
        # --------------------------------

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # --------------------------------
        # 4. Accept WebSocket
        # --------------------------------

        await self.accept()

        print(
            f"Chat connected | "
            f"User: {self.user.username} | "
            f"Conversation: {self.conversation_id}"
        )


    async def disconnect(self, close_code):

        if hasattr(self, "room_group_name"):

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

        print(
            f"Chat disconnected | "
            f"User: {getattr(self.user, 'username', 'Unknown')}"
        )


    async def receive(self, text_data):

        try:

            data = json.loads(text_data)

            message_text = data.get("message", "").strip()

            # -----------------------------
            # Validate message
            # -----------------------------

            if not message_text:
                await self.send_error(
                    "Message cannot be empty."
                )
                return

            if len(message_text) > 5000:
                await self.send_error(
                    "Message is too long."
                )
                return

            # -----------------------------
            # Save message
            # -----------------------------

            message = await self.create_message(
                message_text
            )

            # -----------------------------
            # Send to conversation group
            # -----------------------------

            await self.channel_layer.group_send(

                self.room_group_name,

                {
                    "type": "chat_message",

                    "message_id": message.id,

                    "message": message.content,

                    "sender_id": self.user.id,

                    "sender_name": self.user.username,

                    "created_at": message.created_at.isoformat(),
                }
            )

        except json.JSONDecodeError:

            await self.send_error(
                "Invalid message format."
            )

        except Exception as e:

            print("Chat error:", e)

            await self.send_error(
                "Something went wrong."
            )


    async def chat_message(self, event):

        await self.send(

            text_data=json.dumps({

                "type": "chat_message",

                "message_id": event["message_id"],

                "message": event["message"],

                "sender_id": event["sender_id"],

                "sender_name": event["sender_name"],

                "created_at": event["created_at"],

            })

        )


    async def send_error(self, message):

        await self.send(

            text_data=json.dumps({

                "type": "error",

                "message": message,

            })

        )


    @database_sync_to_async
    def check_membership(self):

        return ConversationMember.objects.filter(

            conversation_id=self.conversation_id,

            user=self.user

        ).exists()


    @database_sync_to_async
    def create_message(self, message_text):

        conversation = Conversation.objects.get(
            id=self.conversation_id
        )

        return Message.objects.create(

            conversation=conversation,

            sender=self.user,

            message_type="TEXT",

            content=message_text,

        )