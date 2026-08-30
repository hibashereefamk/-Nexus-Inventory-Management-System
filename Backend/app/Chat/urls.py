from django.urls import path

from .views import (
    ConversationListView,
    EmployeeSearchView,CreateDirectConversationView,MessageHistoryView,
    ChatFileUploadView
)


urlpatterns = [

    path(
        "conversations/",
        ConversationListView.as_view(),
        name="chat-conversations",
    ),

    path(
        "employees/",
        EmployeeSearchView.as_view(),
        name="chat-employees",
    ),
    path(
        "conversations/direct/",
        CreateDirectConversationView.as_view(),
        name="direct-conversation"
    ),
    path( "conversations/<int:conversation_id>/messages/",
         MessageHistoryView.as_view(),
         name='message-history'),

    path(
    "conversations/<int:conversation_id>/upload/",
    ChatFileUploadView.as_view(), name="chat-file-upload"
),


]