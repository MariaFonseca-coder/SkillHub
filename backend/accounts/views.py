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
    Recibe un token de Firebase y datos extra (name, biography, privacy, etc.)
    para crear/actualizar la información del usuario en Firestore y,
    opcionalmente, en el modelo User de Django.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        name = request.data.get('name', '')
        biography = request.data.get('biography', '')
        privacy = request.data.get('privacy', 'public')
        foto_perfil = request.data.get('fotoPerfil', '')

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

            # 3. Crear/Actualizar la información del usuario en Firestore
            db = firestore.client()
            user_doc_ref = db.collection('users').document(uid)
            user_doc_ref.set({
                'email': email,
                'name': name,
                'biografia': biography,
                'privacidad': privacy,
                'fotoPerfil': foto_perfil,
                'createdAt': firestore.SERVER_TIMESTAMP
            }, merge=True)

            return Response({
                'mensaje': 'Registro (sign-up) exitoso',
                'uid': uid,
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FirebaseLoginView(APIView):
    """
    Recibe un token de Firebase, lo verifica y asocia/crea un usuario en Django.
    Opcionalmente, podrías leer la información de Firestore para retornarla
    al frontend si lo deseas.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No se proporcionó token'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # 1. Verificar el token con Firebase
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email')

            # 2. Crear o buscar el usuario en Django
            user, created = User.objects.get_or_create(
                email=email, 
                defaults={'username': email.split('@')[0]}
            )

            # (Opcional) Leer datos de Firestore para retornarlos
            # db = firestore.client()
            # doc = db.collection('users').document(uid).get()
            # user_data = doc.to_dict() if doc.exists else {}

            return Response({
                'mensaje': 'Autenticación exitosa',
                'uid': uid,
                'user_id': user.id,
                # 'profile': user_data, # si deseas retornar info del perfil
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Token inválido o expirado', 'detalle': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def password_reset_request(request):
    """
    Vista para la recuperación de contraseña usando la funcionalidad de Django,
    aunque si usas Firebase Auth, podrías gestionar la recuperación de
    contraseña directamente desde el cliente con el SDK de Firebase.
    """
    email = request.data.get('email')
    form = PasswordResetForm({'email': email})
    if form.is_valid():
        form.save(
            request=request,
            email_template_name='password_reset_email.html',
        )
        return Response({'mensaje': 'Correo de recuperación enviado.'}, status=status.HTTP_200_OK)
    return Response({'error': 'Email inválido.'}, status=status.HTTP_400_BAD_REQUEST)
