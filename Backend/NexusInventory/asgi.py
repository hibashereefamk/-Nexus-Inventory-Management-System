"""
ASGI config for NexusInventory project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""
import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from app.inventory.routing import websocket_urlpatterns  # adjust if needed

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NexusInventory.settings')
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter(
        websocket_urlpatterns
    ),
})