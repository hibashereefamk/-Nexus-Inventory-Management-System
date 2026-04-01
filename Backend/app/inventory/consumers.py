import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # We define a generic group name for inventory alerts
        # In a larger app, you could use f"dept_{self.scope['user'].department.id}"
        self.group_name = "inventory_alerts"

        # Join the group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()
        print(f"WebSocket Connected to {self.group_name}")

    async def disconnect(self, close_code):
        # Leave the group when the user closes the tab
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        print("WebSocket Disconnected")

    # This method is triggered by broadcast_notification in tasks.py
    async def send_alert(self, event):
        """
        Receives the message from the channel layer and sends it to the React frontend.
        """
        message = event['message']

        # Send message to WebSocket (React side)
        await self.send(text_data=json.dumps({
            "payload": message
        }))

    async def receive(self, text_data):
        """
        Optional: Handle messages sent FROM the React staff dashboard to the server.
        """
        data = json.loads(text_data)
        # You can add logic here if staff needs to 'acknowledge' an alert via WebSocket
        print(f"Message received from frontend: {data}")