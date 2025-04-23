from django.urls import path
from .views import upload_to_firebase

urlpatterns = [
    path('upload/', upload_to_firebase, name='upload'),
]
