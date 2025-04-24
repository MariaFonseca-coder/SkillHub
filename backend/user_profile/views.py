# user/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from firebase_admin import firestore
from firebase_admin import auth as firebase_auth
from .permissions import FirebaseAuthentication  #
from datetime import datetime
from rest_framework.permissions import AllowAny
from django.urls import path


class ProfileView(APIView):
    permission_classes = [FirebaseAuthentication]

    def get(self, request):
        token = request.headers.get('Authorization')

        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            token = token.split(' ')[1]
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')

            db = firestore.client()
            user_doc_ref = db.collection('users').document(uid)
            user_doc = user_doc_ref.get()

            if not user_doc.exists:
                return Response({'error': 'User not found'}, status=404)

            user_data = user_doc.to_dict()

            if 'name' not in user_data or 'email' not in user_data:
                return Response({'error': 'Required user data is missing'}, status=400)

            user_data['fotoPerfil'] = user_data.get('fotoPerfil', None)

            # Agregar role y privacidad en la respuesta
            user_data['role'] = user_data.get('role', 'user')  # Default to 'user' if missing
            user_data['privacidad'] = user_data.get('privacidad', 'public')  # Default to 'public' if missing

            return Response(user_data, status=200)

        except IndexError:
            return Response({'error': 'Token format is incorrect'}, status=400)
        except firebase_auth.ExpiredIdTokenError:
            return Response({'error': 'Token has expired'}, status=401)
        except firebase_auth.InvalidIdTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return Response({'error': f'Error fetching user profile: {str(e)}'}, status=400)

class PublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uid):
        try:
            db = firestore.client()
            user_doc_ref = db.collection('users').document(uid)
            user_doc = user_doc_ref.get()

            if not user_doc.exists:
                return Response({'error': 'User not found'}, status=404)

            user_data = user_doc.to_dict()

            public_profile = {
                'id': uid,
                'name': user_data.get('name'),
                'email': user_data.get('email'),
                'biografia': user_data.get('biografia', ''),
                'fotoPerfil': user_data.get('fotoPerfil', None),
                'privacidad': user_data.get('privacidad', 'public'),
                'role': user_data.get('role', 'user'),  # Default to 'user' if missing
                'displayName': user_data.get('displayName') 
            }

            return Response(public_profile, status=200)

        except Exception as e:
            return Response({'error': f'Error fetching public profile: {str(e)}'}, status=400)
        

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
        


class AddFriendView(APIView):
    """
    View to add a friendship between two users in Firestore.
    """
    permission_classes = [FirebaseAuthentication] 

    def post(self, request, friend_id):
        token = request.headers.get('Authorization')
        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            token = token.split(' ')[1]
            decoded_token = firebase_auth.verify_id_token(token)
            user_id = decoded_token.get('uid') 

            db = firestore.client()

            user_doc_ref = db.collection('users').document(user_id)
            user_doc = user_doc_ref.get()
            if not user_doc.exists:
                return Response({'error': 'User not found'}, status=404)

            user_data = user_doc.to_dict()
            user_name = user_data.get('name', 'Usuario desconocido') 

            friendships_ref = db.collection('friendships')
            existing_friendship = friendships_ref.where('userId1', '==', db.document(f'users/{user_id}')) \
                                                 .where('userId2', '==', db.document(f'users/{friend_id}')) \
                                                 .stream()

            if any(existing_friendship):
                return Response({'error': 'Friendship already exists'}, status=400)

            friendship_data = {
                'userId1': db.document(f'users/{user_id}'),  
                'userId2': db.document(f'users/{friend_id}'),  
                'friendshipDate': datetime.utcnow(),  
                'state': 'accepted'  
            }
            friendships_ref.add(friendship_data)

            notification_data = {
                "UserId": db.document(f"users/{friend_id}"),
                "type": "message",
                "message": f"{user_name} quiere ser tu amigo.", 
                "notificationDate": datetime.utcnow(),
                "readed": False
            }
            db.collection("notifications").add(notification_data)

            return Response({'message': 'Friendship request sent successfully'}, status=201)

        except IndexError:
            return Response({'error': 'Token format is incorrect'}, status=400)
        except firebase_auth.ExpiredIdTokenError:
            return Response({'error': 'Token has expired'}, status=401)
        except firebase_auth.InvalidIdTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return Response({'error': f'Error adding friend: {str(e)}'}, status=400)
        

       
class AddFollowerView(APIView):
    """
    View to add a follower relationship between two users in Firestore.
    """
    permission_classes = [FirebaseAuthentication] 

    def post(self, request, followed_id):
        token = request.headers.get('Authorization')
        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            token = token.split(' ')[1]
            decoded_token = firebase_auth.verify_id_token(token)
            follower_id = decoded_token.get('uid') 

            db = firestore.client()

            user_doc_ref = db.collection('users').document(follower_id)
            user_doc = user_doc_ref.get()
            if not user_doc.exists:
                return Response({'error': 'User not found'}, status=404)

            user_data = user_doc.to_dict()
            user_name = user_data.get('name', 'Usuario desconocido')  
            followers_ref = db.collection('followers')
            existing_follower = followers_ref.where('follower', '==', db.document(f'users/{follower_id}')) \
                                             .where('followed', '==', db.document(f'users/{followed_id}')) \
                                             .stream()

            if any(existing_follower):
                return Response({'error': 'Follower relationship already exists'}, status=400)

            follower_data = {
                'follower': db.document(f'users/{follower_id}'), 
                'followed': db.document(f'users/{followed_id}'),  
                'state': 'accepted' 
            }
            followers_ref.add(follower_data)

            # Create the notification for the followed user
            notification_data = {
                "UserId": db.document(f"users/{followed_id}"),
                "type": "follower",
                "message": f"{user_name} comenzó a seguirte.",  
                "notificationDate": datetime.utcnow(),
                "readed": False
            }
            db.collection("notifications").add(notification_data)

            return Response({'message': 'Follower added successfully'}, status=201)

        except IndexError:
            return Response({'error': 'Token format is incorrect'}, status=400)
        except firebase_auth.ExpiredIdTokenError:
            return Response({'error': 'Token has expired'}, status=401)
        except firebase_auth.InvalidIdTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return Response({'error': f'Error adding follower: {str(e)}'}, status=400)