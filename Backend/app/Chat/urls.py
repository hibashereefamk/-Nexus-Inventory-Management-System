from django.urls import path

from .views import (
    ConversationListView,
    EmployeeSearchView,CreateDirectConversationView,
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


]