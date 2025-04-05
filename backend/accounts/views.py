# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from firebase_admin import auth as firebase_auth
from firebase_admin import firestore
from django.contrib.auth.forms import PasswordResetForm
from rest_framework.decorators import api_view

class FirebaseSignupView(APIView):
    """
    Recibe un token de Firebase y el campo "role" (además de otros campos opcionales)
    para crear/actualizar la información del usuario en Firestore y en el modelo User de Django.
    Se asignan valores por defecto para los campos no enviados.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        role = request.data.get('role', 'user')  # "user" por defecto
        # Campos adicionales: no se reciben desde el formulario, usar valores por defecto
        name = ""
        biography = ""
        privacy = "public"
        foto_perfil = ""

        if not token:
            return Response({'error': 'No se proporcionó token'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Verificar el token con Firebase
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email')

            # 2. Crear o actualizar el usuario en Django
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'username': email.split('@')[0]}
            )
            # Asignar el rol: si es "admin", se establecen los flags correspondientes
            if role == 'admin':
                user.is_staff = True
                user.is_superuser = True
            else:
                user.is_staff = False
                user.is_superuser = False
            user.save()

            # 3. Crear/Actualizar la información del usuario en Firestore
            db = firestore.client()
            user_doc_ref = db.collection('users').document(uid)
            user_doc_ref.set({
                'email': email,
                'name': name,
                'biografia': biography,
                'privacidad': privacy,
                'fotoPerfil': foto_perfil,
                'role': role,
                'createdAt': firestore.SERVER_TIMESTAMP
            }, merge=True)

            return Response({
                'mensaje': 'Registro exitoso',
                'uid': uid,
                'user_id': user.id,
                'role': role
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FirebaseLoginView(APIView):
    """
    Recibe un token de Firebase, lo verifica y asocia/crea un usuario en Django.
    Devuelve el rol del usuario para que el frontend redirija a la vista adecuada.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No se proporcionó token'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email')
            user, created = User.objects.get_or_create(
                email=email, 
                defaults={'username': email.split('@')[0]}
            )
            role = 'admin' if user.is_staff else 'user'

            return Response({
                'mensaje': 'Autenticación exitosa',
                'uid': uid,
                'user_id': user.id,
                'role': role
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Token inválido o expirado', 'detalle': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def password_reset_request(request):
    email = request.data.get('email')
    form = PasswordResetForm({'email': email})
    if form.is_valid():
        form.save(
            request=request,
            email_template_name='password_reset_email.html',
        )
        return Response({'mensaje': 'Correo de recuperación enviado.'}, status=status.HTTP_200_OK)
    return Response({'error': 'Email inválido.'}, status=status.HTTP_400_BAD_REQUEST)

