import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NexusInventory.settings')

app = Celery('NexusInventory')

# Use a string here so the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# This is the critical line that finds your tasks in app/inventory/tasks.py
app.autodiscover_tasks() 

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')