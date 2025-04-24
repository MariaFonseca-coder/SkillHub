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

#LISTA LOS USUARIOS 
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
                    "name": user_data.get("name", "Desconocido"),
                    "fotoPerfil": user_data.get("fotoPerfil", ""),
                    "role": user_data.get("role", ""),
                    "createdAt": user_data.get("createdAt", ""),
                    "status": user_data.get("status", "")  
                })

            return Response({"users": users}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
#CAMBIA EL STATUS DE UN USUARIO A ENABLED
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

#CAMBIA EL STATUS DE UN USUARIO A DISABLED
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

                # Obtener referencia a postReported
                post_reported_ref = report_data.get("postReported", None)
                post_id = post_reported_ref.id if post_reported_ref else "Sin referencia"
                post_path = post_reported_ref.path if post_reported_ref else "Sin ruta"

                post_content = "Sin contenido"
                post_media_url = "Sin media"

                if post_reported_ref:
                    try:
                        post_reported_doc = post_reported_ref.get()
                        post_data = post_reported_doc.to_dict()
                        post_content = post_data.get("content", "Sin contenido")
                        post_media_url = post_data.get("mediaUrl", "Sin media")
                    except Exception as e:
                        post_content = f"Error al obtener contenido: {e}"
                        post_media_url = "Error al obtener media"

                # Obtener referencia al documento de userReported
                user_reported_ref = report_data.get("userReported", None)
                user_reported_name = "Desconocido"
                user_biografia = "Sin biografía"
                user_foto_perfil = "Sin foto"

                if user_reported_ref:
                    try:
                        user_reported_doc = user_reported_ref.get()
                        user_reported_data = user_reported_doc.to_dict()
                        user_reported_name = user_reported_data.get("name", "Desconocido")
                        user_biografia = user_reported_data.get("biografia", "Sin biografía")
                        user_foto_perfil = user_reported_data.get("fotoPerfil", "Sin foto")
                    except Exception as e:
                        user_reported_name = f"Error al obtener nombre: {e}"
                        user_biografia = "Error al obtener biografía"
                        user_foto_perfil = "Error al obtener foto"

                reports.append({
                    "id": report.id,
                    "description": report_data.get("description", "").strip('"'),
                    "postReported": post_id,
                    "postReportedPath": post_path,
                    "postContent": post_content,
                    "postMediaUrl": post_media_url,
                    "reportDate": str(report_data.get("reportDate", "")),
                    "state": report_data.get("state", "").strip('"'),
                    "userId": str(report_data.get("userId", "")),
                    "userReported": str(user_reported_ref.path) if user_reported_ref else "Sin referencia",
                    "userReportedName": user_reported_name,
                    "userReportedBio": user_biografia,
                    "userReportedPhoto": user_foto_perfil,
                    "type": report_data.get("type", "").strip('"')
                })

            return Response({"reports": reports}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



#CAMBIA EL STATUS DE UN REPORTE A DENIED Y ASI YA NO SALE EN FRONTEND
class DenyReportView(APIView):
    def post(self, request, report_id):
        try:
            report_ref = db.collection("reports").document(report_id)
            report_doc = report_ref.get()

            if not report_doc.exists:
                return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

            report_ref.update({"state": "denied"})

            return Response({"message": f"Report {report_id} has been denied."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# DELETE UN POST EN FIRESTORE A PARTIR DE SU ID
class DeletePostView(APIView):
     def patch(self, request, post_id):
        try:
            new_status = request.data.get("status")
            if new_status not in ["enabled", "disabled"]:
                return Response({"error": "Estado inválido."}, status=status.HTTP_400_BAD_REQUEST)

            post_ref = db.collection("posts").document(post_id)
            post_doc = post_ref.get()

            if not post_doc.exists:
                return Response({"error": "El post no existe."}, status=status.HTTP_404_NOT_FOUND)

            post_ref.update({"status": new_status})
            return Response({"message": f"Post {new_status}."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# DESHABILITA UN USUARIO REPORTADO
class DisableReportedUserView(APIView):
    def delete(self, request, user_id):
        try:
            user_ref = db.collection("users").document(user_id)
            user_doc = user_ref.get()

            if not user_doc.exists:
                return Response({"error": "El usuario no existe."}, status=status.HTTP_404_NOT_FOUND)

            user_ref.update({"status": "disabled"})
            return Response({"message": "Usuario deshabilitado exitosamente."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# OBTIENE ID Y STATUS DE UN POST ESPECÍFICO
class GetPostStatusView(APIView):
    def get(self, request, post_id):
        try:
            post_ref = db.collection("posts").document(post_id)
            post_doc = post_ref.get()

            if not post_doc.exists:
                return Response({"error": "El post no existe."}, status=status.HTTP_404_NOT_FOUND)

            post_data = post_doc.to_dict()
            return Response({
                "id": post_id,
                "status": post_data.get("status", "Desconocido")
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# OBTIENE ID Y STATUS DE UN USUARIO ESPECÍFICO
class GetUserStatusView(APIView):
    def get(self, request, user_id):
        try:
            user_ref = db.collection("users").document(user_id)
            user_doc = user_ref.get()

            if not user_doc.exists:
                return Response({"error": "El usuario no existe."}, status=status.HTTP_404_NOT_FOUND)

            user_data = user_doc.to_dict()
            return Response({
                "id": user_id,
                "status": user_data.get("status", "Desconocido")
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework import status  
from rest_framework import status  

class GetAllPostsView(APIView):
    def get(self, request):
        try:
            posts_ref = db.collection("posts")
            posts = posts_ref.stream()

            posts_list = []
            palabras_prohibidas = ["hola", "test", "puta", "idiota","hijueputa", "estupido","imbecil", "tarado", "test","hola", "test","hola", "test","hola", "test","hola", "test","hola", "test"]
            palabra_detectada = False

            for post in posts:
                try:
                    post_data = post.to_dict()
                    post_status = post_data.get("status", "Desconocido")

                    content = post_data.get("content", "Sin contenido")

                    if post_status.lower() == "enabled":
                        for palabra in palabras_prohibidas:
                            if palabra.lower() in content.lower():
                                palabra_detectada = True
                                print("✅ Palabra identificada en algún post")

                                db.collection("posts").document(post.id).update({
                                    "status": "disabled"
                                })
                                print(f"🔄 Post con ID {post.id} actualizado a 'disabled'")
                                break

                    filtered_post = {
                        "id": post.id,
                        "content": content,
                        "status": post_data.get("status", "Desconocido")  
                    }
                    posts_list.append(filtered_post)

                except Exception as e:
                    print(f"⚠️ Error al procesar post {post.id}: {e}")

            response_data = {"posts": posts_list}
            if palabra_detectada:
                response_data["mensaje"] = "Palabra identificada y post(s) desactivado(s)"

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            print("🔥 ERROR en GetAllPostsView:", str(e))
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




import requests
import time

def check_posts_periodically():
    while True:
        try:
            response = requests.get("http://127.0.0.1:8000/api/list-posts/")
            if response.status_code == 200:
                data = response.json()
                if "mensaje" in data and data["mensaje"] == "Palabra identificada":
                    print("Word identified")
                else:
                    print("All clean")
            else:
                print(f"⚠️ Falló la solicitud: {response.status_code}")
        except Exception as e:
            print(f"🔥 Error consultando el endpoint: {e}")

        time.sleep(10000)  # se ajusta tiempo aqui