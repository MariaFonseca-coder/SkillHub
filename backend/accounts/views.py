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
    Recibe un token de Firebase y campos adicionales para crear/actualizar la información
    del usuario en Firestore y en el modelo User de Django.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No se proporcionó token'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Recoger campos adicionales enviados desde el frontend
        role = request.data.get('role', 'student')  # Se espera 'teacher' o 'student'. "admin" se asigna directamente en la DB si es necesario.
        username = request.data.get('username', '')
        full_name = request.data.get('full_name', '')
        location = request.data.get('location', '')
        # Otros campos predeterminados
        biography = ""
        privacy = "public"
        foto_perfil = ""

        try:
            # 1. Verificar el token con Firebase
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email')

            # 2. Crear o actualizar el usuario en Django
            # Si se proporcionó un username, se utiliza; de lo contrario, se usa la parte del email
            username_to_use = username if username else email.split('@')[0]
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'username': username_to_use}
            )
            # Actualiza el username si es distinto
            if user.username != username_to_use:
                user.username = username_to_use

            # Si el rol enviado es "admin" (aunque en la vista no se muestra esa opción), se configuran permisos administrativos
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
                'username': username_to_use,
                'name': full_name,
                'location': location,
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
            # Valor por defecto: si el usuario tiene permisos administrativos
            role = 'admin' if user.is_staff else 'user'
            
            # Consultar en Firestore para obtener el rol guardado (por ejemplo, "teacher" o "student")
            db = firestore.client()
            user_doc_ref = db.collection('users').document(uid)
            user_doc = user_doc_ref.get()
            if user_doc.exists:
                data = user_doc.to_dict()
                role = data.get('role', role)

            return Response({
                'mensaje': 'Autenticación exitosa',
                'uid': uid,
                'user_id': user.id,
                'role': role
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Token inválido o expirado',
                'detalle': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

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
