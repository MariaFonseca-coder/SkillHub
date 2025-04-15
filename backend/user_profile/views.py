# user/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from firebase_admin import firestore
from firebase_admin import auth as firebase_auth
from .permissions import FirebaseAuthentication  #
from datetime import datetime

class ProfileView(APIView):
    """
    Vista para obtener el perfil de usuario desde Firestore.
    Requiere autenticación con Firebase.
    """
    permission_classes = [FirebaseAuthentication]  # Usamos el permiso personalizado

    def get(self, request):
        token = request.headers.get('Authorization')

        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            # Extraer el token del formato "Bearer <token>"
            token = token.split(' ')[1]  # Esto es para separar "Bearer" del token real
            decoded_token = firebase_auth.verify_id_token(token)  # Verificación del token en Firebase
            uid = decoded_token.get('uid')

            # Obtener la información del usuario desde Firestore
            db = firestore.client()
            user_doc_ref = db.collection('users').document(uid)
            user_doc = user_doc_ref.get()

            if not user_doc.exists:
                return Response({'error': 'User not found'}, status=404)

            user_data = user_doc.to_dict()

            # Verificar si los campos esenciales existen en los datos del usuario
            if 'name' not in user_data or 'email' not in user_data:
                return Response({'error': 'Required user data is missing'}, status=400)

            # Asegurar que siempre se retorne la foto de perfil (fotoPerfil)
            user_data['fotoPerfil'] = user_data.get('fotoPerfil', None)

            return Response(user_data, status=200)

        except IndexError:
            return Response({'error': 'Token format is incorrect'}, status=400)
        except firebase_auth.ExpiredIdTokenError:
            return Response({'error': 'Token has expired'}, status=401)
        except firebase_auth.InvalidIdTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return Response({'error': f'Error fetching user profile: {str(e)}'}, status=400)


class AccountManagementView(APIView):
    """
    Vista para actualizar los datos del perfil de usuario.
    Requiere autenticación con Firebase.
    """
    permission_classes = [FirebaseAuthentication]  # Usamos el permiso personalizado

    def put(self, request):
        token = request.headers.get('Authorization')
        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            # Extraer el token del formato "Bearer <token>"
            token = token.split(' ')[1]
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')

            # Obtener los datos enviados en el body de la solicitud
            name = request.data.get('name')
            biography = request.data.get('biografia')  
            privacy = request.data.get('privacidad', 'public')  
            foto_perfil = request.data.get('fotoPerfil')  # Aquí se espera la URL de la foto

            # Verificar que los datos esenciales estén presentes
            if not name or not biography:
                return Response({'error': 'Name and biography are required'}, status=400)

            # Actualizar la información en Firestore
            db = firestore.client()
            user_doc_ref = db.collection('users').document(uid)

            # Construir el diccionario de actualización
            update_data = {
                'name': name,
                'biografia': biography,  
                'privacidad': privacy,  
            }

            # Si se proporcionó una URL de foto de perfil, se actualiza el campo correspondiente
            if foto_perfil:
                update_data['fotoPerfil'] = foto_perfil

            # Actualizar el documento de usuario en Firestore
            user_doc_ref.update(update_data)

            return Response({"message": "Account updated successfully"}, status=200)

        except IndexError:
            return Response({'error': 'Token format is incorrect'}, status=400)
        except firebase_auth.ExpiredIdTokenError:
            return Response({'error': 'Token has expired'}, status=401)
        except firebase_auth.InvalidIdTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return Response({'error': f'Error updating account: {str(e)}'}, status=400)


class UserPostsView(APIView):
    """
    Vista para obtener las publicaciones del usuario desde Firestore.
    """
    permission_classes = [FirebaseAuthentication]  # Usamos el permiso personalizado

    def get(self, request):
        token = request.headers.get('Authorization')

        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            # Extraer el token del formato "Bearer <token>"
            token = token.split(' ')[1]  # Esto es para separar "Bearer" del token real
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')

            # Obtener las publicaciones del usuario desde Firestore
            db = firestore.client()
            posts_ref = db.collection('posts').where('user_uid', '==', uid)
            posts = [doc.to_dict() for doc in posts_ref.stream()]

            return Response(posts, status=200)

        except IndexError:
            return Response({'error': 'Token format is incorrect'}, status=400)
        except firebase_auth.ExpiredIdTokenError:
            return Response({'error': 'Token has expired'}, status=401)
        except firebase_auth.InvalidIdTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return Response({'error': f'Error fetching user posts: {str(e)}'}, status=400)


class RecommendedUsersView(APIView):
    """
    Vista para obtener usuarios recomendados para seguir.
    """
    permission_classes = [FirebaseAuthentication]  # Usamos el permiso personalizado

    def get(self, request):
        token = request.headers.get('Authorization')

        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            # Extraer el token del formato "Bearer <token>"
            token = token.split(' ')[1]
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')

            # Aquí se puede implementar alguna lógica para recomendar usuarios basados en intereses, hashtags, etc.
            db = firestore.client()
            recommended_users_ref = db.collection('users').limit(4)  # Obtén algunos usuarios para recomendar
            recommended_users = []

            for doc in recommended_users_ref.stream():
                user_data = doc.to_dict()  # Obtenemos los datos del usuario
                user_data['uid'] = doc.id  # Agregamos el UID de Firebase (el ID del documento en Firestore)
                recommended_users.append(user_data)
                print(f"User data: {user_data}")  # Agregar log para depurar

            return Response(recommended_users, status=200)

        except IndexError:
            return Response({'error': 'Token format is incorrect'}, status=400)
        except firebase_auth.ExpiredIdTokenError:
            return Response({'error': 'Token has expired'}, status=401)
        except firebase_auth.InvalidIdTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return Response({'error': f'Error fetching recommended users: {str(e)}'}, status=400)


class NotificationsView(APIView):
    """
    Vista para obtener las notificaciones del usuario desde Firestore.
    """
    permission_classes = [FirebaseAuthentication]  # Usamos el permiso personalizado

    def get(self, request):
        token = request.headers.get('Authorization')

        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            # Extraer el token del formato "Bearer <token>"
            token = token.split(' ')[1]  # Esto es para separar "Bearer" del token real
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')

            # Obtener las notificaciones del usuario desde Firestore
            db = firestore.client()
            notifications_ref = db.collection('notifications').where('user_uid', '==', uid)
            notifications = []

            for doc in notifications_ref.stream():
                notification = doc.to_dict()

                # Asegurarse de que el campo 'notificationDate' sea un Timestamp de Firestore
                if isinstance(notification.get('notificationDate'), firestore.Timestamp):
                    # Convertir el Timestamp a una cadena ISO 8601
                    notification['notificationDate'] = notification['notificationDate'].isoformat()

                notifications.append(notification)

            return Response(notifications, status=200)

        except IndexError:
            return Response({'error': 'Token format is incorrect'}, status=400)
        except firebase_auth.ExpiredIdTokenError:
            return Response({'error': 'Token has expired'}, status=401)
        except firebase_auth.InvalidIdTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return Response({'error': f'Error fetching notifications: {str(e)}'}, status=400)