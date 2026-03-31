import json
from channels.generic.websocket import AsyncWebsocketConsumer

class InventoryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # We use a group name to broadcast to all connected staff/managers
        self.group_name = "inventory_alerts"

        # Join the group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # This method is called when the Celery task sends a "send_alert" type message
    async def send_alert(self, event):
        message = event['message']

        # Send message to WebSocket frontend
        await self.send(text_data=json.dumps({
            'message': message
        }))