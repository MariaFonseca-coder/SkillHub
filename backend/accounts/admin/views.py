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
from rest_framework import status as rest_status


db = firestore.client()

class UserListView(APIView):
    def get(self, request):
        try:
            users_ref = db.collection("users")
            query = users_ref.stream()

            users = []

            for user in query:
                user_data = user.to_dict()
                users.append({
                    "id": user.id,
                    "displayName": user_data.get("displayName", "Desconocido"),
                    "fotoPerfil": user_data.get("fotoPerfil", ""),
                    "role": user_data.get("role", ""),
                    "createdAt": user_data.get("createdAt", ""),
                    "status": user_data.get("status", "")  # 👈 Campo agregado aquí
                })

            return Response({"users": users}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class EnableUserView(APIView):
    def post(self, request):
        try:
            user_id = request.data.get("userId")

            if not user_id:
                return Response({"error": "userId is required"}, status=rest_status.HTTP_400_BAD_REQUEST)

            user_ref = db.collection("users").document(user_id)
            user_doc = user_ref.get()

            if not user_doc.exists:
                return Response({"error": "User not found"}, status=rest_status.HTTP_404_NOT_FOUND)

            user_ref.update({"status": "enabled"})

            return Response({"message": f"User {user_id} has been enabled"}, status=rest_status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=rest_status.HTTP_500_INTERNAL_SERVER_ERROR)

class DisableUserView(APIView):
    def post(self, request):
        try:
            user_id = request.data.get("userId")

            if not user_id:
                return Response({"error": "userId is required"}, status=rest_status.HTTP_400_BAD_REQUEST)

            user_ref = db.collection("users").document(user_id)
            user_doc = user_ref.get()

            if not user_doc.exists:
                return Response({"error": "User not found"}, status=rest_status.HTTP_404_NOT_FOUND)

            user_ref.update({"status": "disabled"})

            return Response({"message": f"User {user_id} has been disabled"}, status=rest_status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=rest_status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReportListView(APIView):
    def get(self, request):
        try:
            reports_ref = db.collection("reports")
            query = reports_ref.stream()

            reports = []

            for report in query:
                report_data = report.to_dict()

                # Obtener referencia al documento de userReported
                user_reported_ref = report_data.get("userReported", None)
                user_reported_name = "Desconocido"

                if user_reported_ref:
                    try:
                        user_reported_doc = user_reported_ref.get()
                        user_reported_data = user_reported_doc.to_dict()
                        user_reported_name = user_reported_data.get("name", "Desconocido")
                    except Exception as e:
                        user_reported_name = f"Error al obtener nombre: {e}"

                reports.append({
                    "id": report.id,
                    "description": report_data.get("description", "").strip('"'),
                    "postReported": str(report_data.get("postReported", "")),
                    "reportDate": str(report_data.get("reportDate", "")),
                    "state": report_data.get("state", "").strip('"'),
                    "userId": str(report_data.get("userId", "")),
                    "userReported": str(user_reported_ref),
                    "userReportedName": user_reported_name
                })

            return Response({"reports": reports}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
