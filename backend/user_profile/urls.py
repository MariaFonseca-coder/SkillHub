# profile/urls.py
from django.urls import path
from .views import ProfileView, UserPostsView, AccountManagementView, PublicProfileView, AddFriendView, AddFollowerView, ReportUserView, PublicUserPostsView

urlpatterns = [
    path('', ProfileView.as_view(), name='profile'),
    path('user-posts/', UserPostsView.as_view(), name='user-posts'),
    #path('recommended-users/', RecommendedUsersView.as_view(), name='recommended-users'),
    path('account-management/', AccountManagementView.as_view(), name='account-management'),
    path('add-friend/<str:friend_id>/', AddFriendView.as_view(), name='add-friend'),
    path('add-follower/<str:followed_id>/', AddFollowerView.as_view(), name='add-follower'),
    #path('notifications/', NotificationsView.as_view(), name='notifications')
    path('report-user/', ReportUserView.as_view(), name='report-user'),
    path('<str:uid>/', PublicProfileView.as_view(), name='public-profile'), 
    path('<str:uid>/posts/', PublicUserPostsView.as_view(), name='public-user-posts'),
]