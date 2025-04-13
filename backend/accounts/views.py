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
from datetime import datetime


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

class PasswordResetRequestView(APIView):
    """
    Verifica si el correo existe en la base de datos antes de enviar el correo.
    """
    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({"error": "No se proporcionó un correo"}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar si el email existe en la base de datos de Django
        user_exists = User.objects.filter(email=email).exists()

        if not user_exists:
            return Response({"error": "Este correo no está registrado"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"mensaje": "El correo existe, procede con Firebase"}, status=status.HTTP_200_OK)
    

db = firestore.client()

class FriendListView(APIView):
    """
    Obtiene la lista de amigos para un usuario específico en Firebase Firestore.
    """

    def get(self, request):
        user_id = "zOcHVjePjAaX8m5xeqOuIYqAedh2"  # Temporalmente quemado

        try:
            friendships_ref = db.collection("friendships")
            query = friendships_ref.where("state", "==", "accepted").stream()
            
            friends = []

            for friendship in query:
                data = friendship.to_dict()
                userId1 = data.get("userId1").id
                userId2 = data.get("userId2").id

                if user_id == userId1:
                    friend_id = userId2
                elif user_id == userId2:
                    friend_id = userId1
                else:
                    continue  # No es una amistad del usuario actual, se omite

                # Obtener datos del amigo
                friend_doc = db.collection("users").document(friend_id).get()
                if friend_doc.exists:
                    friend_data = friend_doc.to_dict()
                    friends.append({
                        "id": friend_id,
                        "name": friend_data.get("displayName", "Desconocido"),
                        "fotoPerfil": friend_data.get("fotoPerfil", "")  # <-- Aquí agregamos la URL
                    })

            return Response({"friends": friends}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DeleteFriendshipView(APIView):
    """
    Elimina una amistad entre dos usuarios en Firestore.
    """

    def delete(self, request):
        user_id = "zOcHVjePjAaX8m5xeqOuIYqAedh2"  # Temporalmente quemado
        friend_id = request.data.get("friend_id")

        try:
            friendships_ref = db.collection("friendships")  
            query = friendships_ref.where("state", "==", "accepted").stream()

            for friendship in query:
                data = friendship.to_dict()
                userId1 = data.get("userId1").id
                userId2 = data.get("userId2").id

                if (user_id == userId1 and friend_id == userId2) or (user_id == userId2 and friend_id == userId1):
                    # Eliminar el documento de la amistad
                    friendship.reference.delete()
                    return Response({"message": "Amistad eliminada correctamente."}, status=status.HTTP_200_OK)

            return Response({"error": "Amistad no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetUserInfoView(APIView):
    """
    Devuelve el displayName y la fotoPerfil de un usuario a partir de su ID.
    """

    def get(self, request):
        friend_id = request.GET.get("friend_id")

        if not friend_id:
            return Response({"error": "Falta el parámetro friend_id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_ref = db.collection("users").document(friend_id).get()

            if not user_ref.exists:
                return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

            user_data = user_ref.to_dict()
            return Response({
                "id": friend_id,
                "displayName": user_data.get("displayName", "Desconocido"),
                "fotoPerfil": user_data.get("fotoPerfil", "")
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetChatIdView(APIView):
    """
    Devuelve el ID del chat entre dos usuarios a partir de sus userId.
    Si lo encuentra, también devuelve los mensajes relacionados a ese chat.
    """

    def get(self, request):
        user1 = request.GET.get("user1")
        user2 = request.GET.get("user2")

        if not user1 or not user2:
            return Response({"error": "Faltan parámetros user1 o user2."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            chat_ref = db.collection("chat")
            query = chat_ref.select(["userId1", "userId2"]).stream()

            for doc in query:
                data = doc.to_dict()
                id1 = data.get("userId1").id
                id2 = data.get("userId2").id

                if (user1 == id1 and user2 == id2) or (user1 == id2 and user2 == id1):
                    chat_id = doc.id

                    # Buscar mensajes relacionados al chat
                    messages_ref = db.collection("message").where("chatId", "==", db.document(f"chat/{chat_id}")).order_by("time")
                    messages_query = messages_ref.stream()

                    messages = []
                    for msg_doc in messages_query:
                        msg_data = msg_doc.to_dict()
                        messages.append({
                            "text": msg_data.get("text"),
                            "time": msg_data.get("time").isoformat() if msg_data.get("time") else None,
                            "user": msg_data.get("user").id if msg_data.get("user") else None
                        })

                    return Response({
                        "chatId": chat_id,
                        "messages": messages
                    }, status=status.HTTP_200_OK)

                # Si no existe, lo creamos
            new_chat_ref = chat_ref.document()
            new_chat_ref.set({
                "userId1": db.document(f"users/{user1}"),
                "userId2": db.document(f"users/{user2}")
            })

            return Response({
                "chatId": new_chat_ref.id,
                "messages": []  # nuevo, así que no hay mensajes aún
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SendMessageView(APIView):
    """
    Guarda un nuevo mensaje en Firestore con chatId, texto, user y marca de tiempo.
    """

    def post(self, request):
        chat_id = request.data.get("chatId")
        text = request.data.get("text")
        user_id = request.data.get("userId")

        if not chat_id or not text or not user_id:
            return Response({"error": "Faltan parámetros (chatId, text o userId)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            message_data = {
                "chatId": db.document(f"chat/{chat_id}"),
                "text": text,
                "time": datetime.utcnow(),
                "user": db.document(f"users/{user_id}")
            }

            db.collection("message").add(message_data)

            return Response({"success": True, "message": "Mensaje enviado correctamente."}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
