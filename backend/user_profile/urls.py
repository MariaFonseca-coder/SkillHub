# profile/urls.py
from django.urls import path
from .views import ProfileView, UserPostsView, RecommendedUsersView, AccountManagementView

urlpatterns = [
    path('', ProfileView.as_view(), name='profile'),
    path('user-posts/', UserPostsView.as_view(), name='user-posts'),
    path('recommended-users/', RecommendedUsersView.as_view(), name='recommended-users'),
    path('account-managment/', AccountManagementView.as_view(), name='account-managment'),
    path('notifications/', RecommendedUsersView.as_view(), name='notifications')
]