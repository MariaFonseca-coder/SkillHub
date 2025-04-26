# accounts/urls.py
from django.urls import path, include
from .views import FirebaseLoginView, FirebaseSignupView, password_reset_request, PasswordResetRequestView, FriendListView, DeleteFriendshipView, GetUserInfoView, GetChatIdView, SendMessageView, FollowersListView, DeleteFollowerView, FriendListViewPending

from .admin.views import UserListView, EnableUserView, DisableUserView, ReportListView, DenyReportView, DeletePostView, DisableReportedUserView, GetPostStatusView, GetUserStatusView, GetAllPostsView


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
    path('followers-list/', FollowersListView.as_view(), name='followers-list'),  
    path('delete-follower/', DeleteFollowerView.as_view(), name='delete-follower'),
    path('list-users/', UserListView.as_view(), name='list-users'),
    path('enable-user/', EnableUserView.as_view(), name='enable-user'),
    path('disable-user/', DisableUserView.as_view(), name='disable-user'),
    path('list-reports/', ReportListView.as_view(), name='list-reports'),
    path('deny-report/<str:report_id>/', DenyReportView.as_view(), name='deny-report'),
    path('delete-post/<str:post_id>/', DeletePostView.as_view(), name='delete-post'),
    path('disable-user/<str:user_id>/', DisableReportedUserView.as_view(), name='disable-user'),
    path('get-post-status/<str:post_id>/', GetPostStatusView.as_view()),
    path('get-user-status/<str:user_id>/', GetUserStatusView.as_view()),
    path('list-posts/', GetAllPostsView.as_view(), name='list-posts'),
    path('friends-list-pending/', FriendListViewPending.as_view(), name='friends-list-pending'),

    path('api/', include('posts.urls')),

]
