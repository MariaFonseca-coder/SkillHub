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
        estado = "enabled" #annadido por Allan para manejar el deshabilitar cuenta

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
                'status': estado, #annadido por Allan para manejar el deshabilitar cuenta
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
            # Verificar el token de Firebase
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email')

            # Crear o asociar el usuario en Django
            user, created = User.objects.get_or_create(
                email=email, 
                defaults={'username': email.split('@')[0]}
            )

            # Valor por defecto: si el usuario tiene permisos administrativos
            role = 'admin' if user.is_staff else 'user'

            # Consultar en Firestore para obtener el rol y el estado del usuario
            db = firestore.client()
            user_doc_ref = db.collection('users').document(uid)
            user_doc = user_doc_ref.get()

            if not user_doc.exists:
                return Response({'error': 'Usuario no encontrado en Firestore'}, status=status.HTTP_404_NOT_FOUND)

            user_data = user_doc.to_dict()
            role = user_data.get('role', role)
            status_attr = user_data.get('status', 'enabled')  # Por defecto, "enabled"

            # Verificar si el usuario está deshabilitado
            if status_attr == 'disabled':
                return Response({'error': 'El usuario está deshabilitado. Contacte al administrador.'}, status=status.HTTP_403_FORBIDDEN)

            return Response({
                'mensaje': 'Autenticación exitosa',
                'uid': uid,
                'user_id': user.id,
                'role': role
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error al verificar el token: {str(e)}") 
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

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from firebase_admin import firestore  
from django.contrib.auth.models import User

class PasswordResetRequestView(APIView):
    """
    Verifica si el correo existe en la base de datos antes de enviar el correo,
    y si tiene rol 'admin' devuelve un mensaje especial.
    """
    def post(self, request):


        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response({"error": "No se proporcionó un correo"}, status=status.HTTP_400_BAD_REQUEST)


        db = firestore.client()
        users_ref = db.collection("users")
        query = users_ref.where("email", "==", email).limit(1).stream()

        user_data = None
        for doc in query:
            user_data = doc.to_dict()
            break

        if not user_data:
            return Response({"error": "Usuario no encontrado en Firestore"}, status=status.HTTP_404_NOT_FOUND)

        role = user_data.get("role", "").lower()
        if role == "admin":
            return Response({"mensaje": "admin"}, status=status.HTTP_200_OK)

        return Response({"mensaje": "ok"}, status=status.HTTP_200_OK)

db = firestore.client()

from firebase_admin import auth

class FriendListView(APIView):
    def get(self, request):
        # Obtener el token del encabezado Authorization
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"error": "Token no proporcionado"}, status=status.HTTP_401_UNAUTHORIZED)

        id_token = auth_header.split(" ")[1]

        try:
            # Verificar el token de Firebase y obtener el uid
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token["uid"]
        except Exception as e:
            return Response({"error": f"Token inválido: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

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
                    continue

                friend_doc = db.collection("users").document(friend_id).get()
                if friend_doc.exists:
                    friend_data = friend_doc.to_dict()
                    friends.append({
                        "id": friend_id,
                        "name": friend_data.get("name", "Desconocido"),
                        "fotoPerfil": friend_data.get("fotoPerfil", "")
                    })

            return Response({"friends": friends}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class FriendListViewPending(APIView):
    def get(self, request):
        # Obtener el token del encabezado Authorization
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"error": "Token no proporcionado"}, status=status.HTTP_401_UNAUTHORIZED)

        id_token = auth_header.split(" ")[1]

        try:
            # Verificar el token de Firebase y obtener el uid
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token["uid"]
        except Exception as e:
            return Response({"error": f"Token inválido: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            friendships_ref = db.collection("friendships")
            query = friendships_ref.where("state", "==", "pending").stream()

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
                    continue

                friend_doc = db.collection("users").document(friend_id).get()
                if friend_doc.exists:
                    friend_data = friend_doc.to_dict()
                    friends.append({
                        "id": friend_id,
                        "name": friend_data.get("name", "Desconocido"),
                        "fotoPerfil": friend_data.get("fotoPerfil", "")
                    })

            return Response({"friends": friends}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def put(self, request):
        # Obtener el token del encabezado Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"error": "Authorization header missing or invalid."}, status=status.HTTP_401_UNAUTHORIZED)

        id_token = auth_header.split(" ")[1]

        try:
            # Verificar el token de Firebase y obtener el uid
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token["uid"]

            # Obtener el friend_id y el nuevo estado del cuerpo de la solicitud
            friend_id = request.data.get("friend_id")
            new_state = request.data.get("state")

            if not friend_id or not new_state:
                return Response({"error": "Missing friend_id or state in request."}, status=status.HTTP_400_BAD_REQUEST)

            if new_state not in ["accepted", "denied"]:
                return Response({"error": "Invalid state. Must be 'accepted' or 'denied'."}, status=status.HTTP_400_BAD_REQUEST)

            # Buscar la relación de amistad en Firestore
            friendships_ref = db.collection("friendships")
            query = friendships_ref.where("state", "==", "pending").stream()

            for friendship in query:
                data = friendship.to_dict()
                userId1 = data.get("userId1").id
                userId2 = data.get("userId2").id

                # Verificar si la relación de amistad involucra al usuario actual y al friend_id
                if (user_id == userId1 and friend_id == userId2) or (user_id == userId2 and friend_id == userId1):
                    # Actualizar el estado de la relación de amistad
                    friendship.reference.update({"state": new_state})

                    # Obtener el nombre del usuario actual
                    user_doc = db.collection("users").document(user_id).get()
                    user_name = user_doc.to_dict().get("name", "Usuario desconocido")

                    # Determinar el ID del usuario que recibirá la notificación
                    followed_id = userId2 if user_id == userId1 else userId1

                    # Crear el mensaje de notificación basado en el estado
                    if new_state == "accepted":
                        message = f"{user_name} aceptó tu solicitud de amistad."
                    else:  # new_state == "denied"
                        message = f"{user_name} rechazó tu solicitud de amistad."

                    # Crear la notificación
                    notification_data = {
                        "UserId": db.document(f"users/{followed_id}"),
                        "type": "friendship",
                        "message": message,
                        "notificationDate": datetime.utcnow(),
                        "readed": False
                    }
                    db.collection("notifications").add(notification_data)

                    return Response({"message": f"Friendship updated to {new_state}."}, status=status.HTTP_200_OK)

            return Response({"error": "Friendship not found."}, status=status.HTTP_404_NOT_FOUND)

        except auth.InvalidIdTokenError:
            return Response({"error": "Invalid ID token."}, status=status.HTTP_401_UNAUTHORIZED)
        except auth.ExpiredIdTokenError:
            return Response({"error": "Expired ID token."}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FollowersListView(APIView):
    def get(self, request):
        # Obtener el token del encabezado Authorization
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"error": "Token no proporcionado"}, status=status.HTTP_401_UNAUTHORIZED)

        id_token = auth_header.split(" ")[1]

        try:
            # Verificar el token de Firebase y obtener el uid
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token["uid"]
        except Exception as e:
            return Response({"error": f"Token inválido: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            followers_ref = db.collection("followers")
            query = followers_ref.where("followed", "==", db.document(f"users/{user_id}")) \
                                 .where("state", "==", "accepted") \
                                 .stream()

            followers = []

            for doc in query:
                data = doc.to_dict()
                follower_ref = data.get("follower")

                if follower_ref:
                    follower_id = follower_ref.id
                    follower_doc = db.collection("users").document(follower_id).get()

                    if follower_doc.exists:
                        follower_data = follower_doc.to_dict()
                        followers.append({
                            "id": follower_id,
                            "name": follower_data.get("name", "Desconocido"),
                            "fotoPerfil": follower_data.get("fotoPerfil", "")
                        })

            return Response({"followers": followers}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from firebase_admin import firestore



db = firestore.client()

class DeleteFriendshipView(APIView):
    """
    Desactiva una amistad entre dos usuarios en Firestore (cambia 'state' a 'disabled').
    """

    def delete(self, request):
        # Obtener el token del encabezado Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"error": "Authorization header missing or invalid."}, status=status.HTTP_401_UNAUTHORIZED)

        id_token = auth_header.split(" ")[1]

        try:
            # Verificamos el token con Firebase Admin
            decoded_token = firebase_auth.verify_id_token(id_token)
            user_id = decoded_token["uid"]

            friend_id = request.data.get("friend_id")
            if not friend_id:
                return Response({"error": "Missing friend_id in request."}, status=status.HTTP_400_BAD_REQUEST)

            friendships_ref = db.collection("friendships")
            query = friendships_ref.where("state", "==", "accepted").stream()

            for friendship in query:
                data = friendship.to_dict()
                userId1 = data.get("userId1").id
                userId2 = data.get("userId2").id

                if (user_id == userId1 and friend_id == userId2) or (user_id == userId2 and friend_id == userId1):
                    # Cambiar el estado a 'disabled' en lugar de eliminar
                    friendship.reference.update({"state": "disabled"})
                    return Response({"message": "Friend deleted."}, status=status.HTTP_200_OK)

            return Response({"error": "Friendship not found"}, status=status.HTTP_404_NOT_FOUND)

        except firebase_auth.InvalidIdTokenError:
            return Response({"error": "Invalid ID token."}, status=status.HTTP_401_UNAUTHORIZED)
        except firebase_auth.ExpiredIdTokenError:
            return Response({"error": "Expired ID token."}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from firebase_admin import auth as firebase_auth
from firebase_admin import firestore

db = firestore.client()

class DeleteFollowerView(APIView):
    """
    Desactiva un seguidor cambiando el estado a 'disabled' en la colección followers.
    """

    def delete(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response({"error": "Authorization header missing or invalid."}, status=status.HTTP_401_UNAUTHORIZED)

        id_token = auth_header.split(" ")[1]

        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            user_id = decoded_token["uid"]

            follower_id = request.data.get("follower_id")
            if not follower_id:
                return Response({"error": "Missing follower_id in request."}, status=status.HTTP_400_BAD_REQUEST)

            followers_ref = db.collection("followers")
            query = followers_ref.where("state", "==", "accepted").stream()

            for follower_doc in query:
                data = follower_doc.to_dict()
                followed_user = data.get("followed")
                follower_user = data.get("follower")

                if followed_user.id == user_id and follower_user.id == follower_id:
                    follower_doc.reference.update({"state": "disabled"})
                    return Response({"message": "Follower disabled."}, status=status.HTTP_200_OK)

            return Response({"error": "Follower relationship not found."}, status=status.HTTP_404_NOT_FOUND)

        except firebase_auth.InvalidIdTokenError:
            return Response({"error": "Invalid ID token."}, status=status.HTTP_401_UNAUTHORIZED)
        except firebase_auth.ExpiredIdTokenError:
            return Response({"error": "Expired ID token."}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetUserInfoView(APIView):
    """
    Devuelve el name y la fotoPerfil de un usuario a partir de su ID.
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
                "name": user_data.get("name") or user_data.get("name", "Desconocido"),
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
    Guarda un nuevo mensaje en Firestore y crea una notificación con datos específicos.
    """

    def post(self, request):
        chat_id = request.data.get("chatId")
        text = request.data.get("text")
        user_id = request.data.get("userId")        # Remitente
        recipient_id = request.data.get("receiverId")  # Receptor

        if not chat_id or not text or not user_id or not recipient_id:
            return Response({"error": "Faltan parámetros (chatId, text, userId o receiverId)."}, status=status.HTTP_400_BAD_REQUEST)

        try:

            sender_ref = db.collection("users").document(user_id).get()
            if not sender_ref.exists:
                return Response({"error": "Usuario remitente no encontrado."}, status=status.HTTP_404_NOT_FOUND)

            sender_data = sender_ref.to_dict()
            sender_display_name = sender_data.get("displayName") or sender_data.get("name", "Usuario desconocido")
            message_data = {
                "chatId": db.document(f"chat/{chat_id}"),
                "text": text,
                "time": datetime.utcnow(),
                "user": db.document(f"users/{user_id}"),
            }
            notification_data = {
                "UserId": db.document(f"users/{recipient_id}"),
                "type": "message",
                "message": f"{sender_display_name} te ha enviado un mensaje: {text}",
                "notificationDate": datetime.utcnow(),
                "readed": False
            }
            db.collection("notifications").add(notification_data)


            db.collection("message").add(message_data)

       

            db.collection("notifications").add(notification_data)

            return Response({"success": True, "message": "Mensaje y notificación creados correctamente."}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

