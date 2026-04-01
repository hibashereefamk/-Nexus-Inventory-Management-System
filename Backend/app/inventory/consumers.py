import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "inventory_alerts"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # CHANGE THIS NAME: It must match the "type" sent from models.py
    async def task_update(self, event):
        """
        Receives the message from the channel layer and sends it to React.
        """
        message = event['message']
        await self.send(text_data=json.dumps({
            "type": event.get("notification_type"),
            "message": message
        }))