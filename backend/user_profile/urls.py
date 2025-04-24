# profile/urls.py
from django.urls import path
from .views import ProfileView, UserPostsView, AccountManagementView, PublicProfileView, AddFriendView, AddFollowerView

urlpatterns = [
    path('', ProfileView.as_view(), name='profile'),
    path('<str:uid>/', PublicProfileView.as_view(), name='public-profile'), 
    path('user-posts/', UserPostsView.as_view(), name='user-posts'),
    #path('recommended-users/', RecommendedUsersView.as_view(), name='recommended-users'),
    path('account-managment/', AccountManagementView.as_view(), name='account-managment'),
    path('add-friend/<str:friend_id>/', AddFriendView.as_view(), name='add-friend'),
    path('add-follower/<str:followed_id>/', AddFollowerView.as_view(), name='add-follower'),

    #path('notifications/', NotificationsView.as_view(), name='notifications')
]