# login/forms.py

from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser, Profile, ROLE_CHOICES

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    # Para fines de prueba, se permite seleccionar el rol.
    # En producción, lo ideal es forzar 'user' y crear administradores por otro proceso.
    role = forms.ChoiceField(choices=ROLE_CHOICES)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'role', 'password1', 'password2')

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ('bio', 'location', 'profile_image', 'interests')

