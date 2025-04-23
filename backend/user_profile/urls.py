# profile/urls.py
from django.urls import path
from .views import ProfileView, UserPostsView, AccountManagementView, PublicProfileView

urlpatterns = [
    path('', ProfileView.as_view(), name='profile'),
    path('user-posts/', UserPostsView.as_view(), name='user-posts'),
    #path('recommended-users/', RecommendedUsersView.as_view(), name='recommended-users'),
    path('account-management/', AccountManagementView.as_view(), name='account-management'),
    #path('notifications/', NotificationsView.as_view(), name='notifications')
    path('<str:uid>/', PublicProfileView.as_view(), name='public-profile'), 
]