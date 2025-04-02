from rest_framework.permissions import BasePermission
from firebase_admin import auth as firebase_auth
import logging


# Nota: Este archivo lo que hace es validar el token de acceso que da firebase. 

# Configuración del logger para registrar los eventos relacionados con la autenticación
logger = logging.getLogger(__name__)

class FirebaseAuthentication(BasePermission):
    """
    Permiso personalizado para autenticar solicitudes usando un token de Firebase
    enviado en la cabecera Authorization con el formato "Bearer <token>".
    
    Este permiso verifica que el token Firebase proporcionado sea válido y
    pertenece a un usuario registrado en Firebase.
    """

    def has_permission(self, request, view):
        """
        Verifica si el usuario tiene permiso para acceder al recurso basado en el token Firebase.
        Se asegura de que el token esté presente y sea válido.
        
        Args:
            request (Request): La solicitud HTTP entrante.
            view (APIView): La vista que está siendo procesada.
        
        Returns:
            bool: Devuelve True si el token es válido y se tiene acceso, False si no.
        """
        # Extraemos el token de la cabecera Authorization
        token = self.get_token_from_header(request)
        
        # Si no se proporciona un token o el formato es incorrecto, denegamos el acceso
        if not token:
            logger.error('No token provided in Authorization header.')
            return False

        try:
            # Verificamos el token de Firebase
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')  # Extraemos el UID del token decodificado
            
            # Si la verificación es exitosa, se permite el acceso
            return True
        except IndexError:
            # Si el token no sigue el formato "Bearer <token>", se registrará un error
            logger.error('Authorization token format is incorrect. Missing "Bearer <token>".')
        except firebase_auth.ExpiredIdTokenError:
            # Si el token ha expirado, se registrará el error
            logger.error('The Firebase token has expired.')
        except firebase_auth.InvalidIdTokenError:
            # Si el token es inválido, se registrará el error
            logger.error('The Firebase token is invalid.')
        except Exception as e:
            # Si ocurre cualquier otro error durante la verificación del token, se registrará
            logger.error(f'An error occurred while verifying the Firebase token: {str(e)}')

        # Si cualquier excepción ocurre, no se permite el acceso
        return False

    def get_token_from_header(self, request):
        """
        Extrae el token de la cabecera Authorization en el formato "Bearer <token>".
        Si el formato es incorrecto o no existe, devuelve None.
        
        Args:
            request (Request): La solicitud HTTP entrante.
        
        Returns:
            str or None: El token si se encuentra, None si no se encuentra o el formato es incorrecto.
        """
        # Recuperamos el valor de la cabecera Authorization
        token = request.headers.get('Authorization')

        # Comprobamos si el token sigue el formato "Bearer <token>"
        if token and token.startswith('Bearer '):
            return token.split(' ')[1]  # Devuelve solo el token, sin el prefijo "Bearer"
        
        # Si el formato no es correcto, retornamos None
        return None
