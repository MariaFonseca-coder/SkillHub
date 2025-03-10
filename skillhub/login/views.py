# login/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.http import JsonResponse
from .forms import CustomUserCreationForm, ProfileForm
from .firebase import verify_firebase_token
from .models import CustomUser

def registro_view(request):
    """
    Vista de registro:
    Permite que el usuario se registre, seleccionando (para fines de demostración) su rol.
    """
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            # Aquí se pueden agregar validaciones adicionales o forzar rol 'user'
            user.save()
            # Se recomienda crear el perfil asociado vía señales (signals)
            return redirect('login:politicas')
    else:
        form = CustomUserCreationForm()
    return render(request, 'login/registro.html', {'form': form})

def politicas_view(request):
    """
    Vista de políticas:
    Se muestra el reglamento y se debe aceptar para continuar.
    """
    if request.method == 'POST':
        acepto = request.POST.get('acepto')
        if acepto == 'on':
            return redirect('login:agregar_intereses')
        else:
            error = "Debes aceptar las políticas para continuar."
            return render(request, 'login/politicas.html', {'error': error})
    return render(request, 'login/politicas.html')

def firebase_login_view(request):
    """
    Vista de login con Firebase:
    Se recibe un 'id_token' vía POST, se verifica con Firebase y se autentica al usuario.
    Dependiendo del rol del usuario (admin o user), se devuelve la respuesta correspondiente.
    """
    if request.method == 'POST':
        id_token = request.POST.get('id_token')
        decoded_token = verify_firebase_token(id_token)
        if decoded_token:
            uid = decoded_token['uid']
            email = decoded_token.get('email')
            # Buscar o crear el usuario basado en el email y el uid de Firebase.
            user, created = CustomUser.objects.get_or_create(
                email=email,
                defaults={
                    'firebase_uid': uid,
                    'username': email.split('@')[0],
                    # Por defecto se asigna 'user'; si se requiere, se puede forzar otro valor.
                    'role': 'user'
                }
            )
            # Actualizar firebase_uid si es necesario.
            if not user.firebase_uid:
                user.firebase_uid = uid
                user.save()

            # Aquí se puede agregar lógica adicional para verificar si el usuario
            # tiene permiso para loguearse (por ejemplo, si está desactivado o similar).

            # Autenticamos y diferenciamos según el rol.
            login(request, user)
            if user.role == 'admin':
                return JsonResponse({'status': 'success', 'role': 'admin'})
            elif user.role == 'user':
                return JsonResponse({'status': 'success', 'role': 'user'})
            else:
                return JsonResponse({'status': 'error', 'message': 'Rol no permitido'}, status=403)
        else:
            return JsonResponse({'status': 'error', 'message': 'Token inválido'}, status=400)
    return render(request, 'login/login.html')

def agregar_intereses_view(request):
    """
    Vista para que el usuario agregue intereses (hashtags) tras aceptar las políticas.
    """
    if request.method == 'POST':
        form = ProfileForm(request.POST, request.FILES, instance=request.user.profile)
        if form.is_valid():
            form.save()
            return redirect('landing_page')  # Redirige a la página principal o landing page
    else:
        form = ProfileForm(instance=request.user.profile)
    return render(request, 'login/agregar_intereses.html', {'form': form})
