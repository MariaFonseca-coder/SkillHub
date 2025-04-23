# profile/urls.py
from django.urls import path
from .views import ProfileView, UserPostsView, AccountManagementView, PublicProfileView

urlpatterns = [
    path('', ProfileView.as_view(), name='profile'),
    path('<str:uid>/', PublicProfileView.as_view(), name='public-profile'), 
    path('user-posts/', UserPostsView.as_view(), name='user-posts'),
    #path('recommended-users/', RecommendedUsersView.as_view(), name='recommended-users'),
    path('account-managment/', AccountManagementView.as_view(), name='account-managment'),
    #path('notifications/', NotificationsView.as_view(), name='notifications')
]