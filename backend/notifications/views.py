
# user/views.py
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from firebase_admin import firestore
from firebase_admin import auth as firebase_auth
from .permissions import FirebaseAuthentication  
from datetime import datetime
from rest_framework.permissions import AllowAny

# Create your views here.

class NotificationsView(APIView):
    """
    View to GET user notifications and PUT to mark one as read.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.headers.get('Authorization')
        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            token = token.split(' ')[1]
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token['uid']

            db = firestore.client()
            user_doc = db.collection('users').document(uid)
            notifications_query = db.collection('notifications').where('UserId', '==', user_doc)

            notifications = []
            for doc in notifications_query.stream():
                data = doc.to_dict()
                data['id'] = doc.id

                # Serializar campos
                if 'notificationDate' in data:
                    data['notificationDate'] = str(data['notificationDate'])
                if isinstance(data.get('UserId'), firestore.DocumentReference):
                    data['UserId'] = data['UserId'].path

                notifications.append(data)

            return Response(notifications, status=200)

        except Exception as e:
            return Response({'error': f'Error fetching notifications: {str(e)}'}, status=500)

    def put(self, request):
        token = request.headers.get('Authorization')
        if not token:
            return Response({'error': 'Authorization header is missing'}, status=400)

        try:
            token = token.split(' ')[1]
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token['uid']

            notification_id = request.data.get('notificationId')
            if not notification_id:
                return Response({'error': 'Notification ID is required'}, status=400)

            db = firestore.client()
            notification_ref = db.collection('notifications').document(notification_id)
            notification_doc = notification_ref.get()

            if not notification_doc.exists:
                return Response({'error': 'Notification not found'}, status=404)

            notification_data = notification_doc.to_dict()
            user_id_ref = notification_data.get('UserId')

            if not isinstance(user_id_ref, firestore.DocumentReference) or user_id_ref.id != uid:
                return Response({'error': 'Permission denied'}, status=403)

            # ✅ Actualizar
            notification_ref.update({'readed': True})

            return Response({'message': 'Notification marked as read'}, status=200)

        except Exception as e:
            return Response({'error': f'Error updating notification: {str(e)}'}, status=500)