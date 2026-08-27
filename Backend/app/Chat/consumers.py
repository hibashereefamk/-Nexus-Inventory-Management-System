import json

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from .models import (
    Conversation,
    ConversationMember,
    Message
)


class ChatConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):

        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.conversation_id = (
            self.scope["url_route"]["kwargs"][
                "conversation_id"
            ]
        )

        self.room_group_name = (
            f"chat_{self.conversation_id}"
        )

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


    # =====================================================
    # RECEIVE
    # =====================================================

    async def receive_json(self, content, **kwargs):

        event_type = content.get("type")


        # -------------------------------------------------
        # SEND NEW MESSAGE
        # -------------------------------------------------

        if event_type == "message":

            message_text = (
                content.get("message", "").strip()
            )

            if not message_text:
                return

            message = await self.create_message(
                message_text
            )

            await self.channel_layer.group_send(

                self.room_group_name,

                {
                    "type": "chat_message",

                    "message_id":
                        message["id"],

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


        # -------------------------------------------------
        # EDIT MESSAGE
        # -------------------------------------------------

        elif event_type == "edit_message":

            message_id = content.get(
                "message_id"
            )

            new_content = (
                content.get("content", "").strip()
            )

            if not message_id or not new_content:
                return

            message = await self.edit_message(
                message_id,
                new_content
            )

            if not message:
                return

            await self.channel_layer.group_send(

                self.room_group_name,

                {
                    "type": "message_edited",

                    "message_id":
                        message["id"],

                    "content":
                        message["content"],

                    "updated_at":
                        message["updated_at"],
                }
            )


        # -------------------------------------------------
        # DELETE MESSAGE
        # -------------------------------------------------

        elif event_type == "delete_message":

            message_id = content.get(
                "message_id"
            )

            if not message_id:
                return

            message = await self.delete_message(
                message_id
            )

            if not message:
                return

            await self.channel_layer.group_send(

                self.room_group_name,

                {
                    "type": "message_deleted",

                    "message_id":
                        message["id"],

                    "deleted_at":
                        message["updated_at"],
                }
            )


    # =====================================================
    # NEW MESSAGE EVENT
    # =====================================================

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


    # =====================================================
    # EDIT EVENT
    # =====================================================

    async def message_edited(self, event):

        await self.send_json({

            "type":
                "message_edited",

            "message_id":
                event["message_id"],

            "content":
                event["content"],

            "updated_at":
                event["updated_at"],

        })


    # =====================================================
    # DELETE EVENT
    # =====================================================

    async def message_deleted(self, event):

        await self.send_json({

            "type":
                "message_deleted",

            "message_id":
                event["message_id"],

            "deleted_at":
                event["deleted_at"],

        })


    # =====================================================
    # CHECK MEMBERSHIP
    # =====================================================

    @database_sync_to_async
    def check_membership(self):

        return ConversationMember.objects.filter(

            conversation_id=
                self.conversation_id,

            user=self.user

        ).exists()


    # =====================================================
    # CREATE
    # =====================================================

    @database_sync_to_async
    def create_message(self, content):

        message = Message.objects.create(

            conversation_id=
                self.conversation_id,

            sender=self.user,

            message_type="TEXT",

            content=content

        )

        return {

            "id":
                message.id,

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


    # =====================================================
    # EDIT
    # =====================================================

    @database_sync_to_async
    def edit_message(
        self,
        message_id,
        new_content
    ):

        try:

            message = Message.objects.get(

                id=message_id,

                conversation_id=
                    self.conversation_id,

                sender=self.user,

                is_deleted=False

            )

        except Message.DoesNotExist:

            return None


        message.content = new_content

        message.is_edited = True

        message.save(
            update_fields=[
                "content",
                "is_edited",
                "updated_at"
            ]
        )


        return {

            "id":
                message.id,

            "content":
                message.content,

            "updated_at":
                message.updated_at.isoformat(),

        }


    # =====================================================
    # DELETE
    # =====================================================

    @database_sync_to_async
    def delete_message(
        self,
        message_id
    ):

        try:

            message = Message.objects.get(

                id=message_id,

                conversation_id=
                    self.conversation_id,

                sender=self.user,

                is_deleted=False

            )

        except Message.DoesNotExist:

            return None


        message.is_deleted = True

        message.content = None

        message.save(
            update_fields=[
                "is_deleted",
                "content",
                "updated_at"
            ]
        )


        return {

            "id":
                message.id,

            "updated_at":
                message.updated_at.isoformat(),

        }