# login/urls.py

from django.urls import path
from . import views

app_name = 'login'

urlpatterns = [
    path('registro/', views.registro_view, name='registro'),
    path('politicas/', views.politicas_view, name='politicas'),
    path('login/', views.firebase_login_view, name='login'),
    path('agregar-intereses/', views.agregar_intereses_view, name='agregar_intereses'),
    # Se pueden agregar otras rutas como recuperación de contraseña, perfil, etc.
]
