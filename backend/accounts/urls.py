# accounts/urls.py
from django.urls import path
from .views import FirebaseLoginView, FirebaseSignupView, password_reset_request, PasswordResetRequestView, FriendListView, DeleteFriendshipView, GetUserInfoView, GetChatIdView, SendMessageView

urlpatterns = [
    path('firebase-signup/', FirebaseSignupView.as_view(), name='firebase-signup'),
    path('firebase-login/', FirebaseLoginView.as_view(), name='firebase-login'),
    path('password-reset/', password_reset_request, name='password-reset'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('friends-list/', FriendListView.as_view(), name='friends-list'),  
    path('delete-friend/', DeleteFriendshipView.as_view(), name='delete-friend'),
    path('get_user_info/', GetUserInfoView.as_view(), name='get_user_info'),
    path('get-chat-id/', GetChatIdView.as_view(), name='get-chat-id'),
    path('send-message/', SendMessageView.as_view(), name="send-message"),

]
