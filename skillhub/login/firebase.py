import os
import firebase_admin
from firebase_admin import credentials, auth

# Define la ruta correcta al archivo de credenciales descargado
FIREBASE_CERT_PATH = os.path.join(os.path.dirname(__file__), 'fb.json')

# Inicializa Firebase Admin SDK (esto se hace una sola vez)
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CERT_PATH)
    firebase_admin.initialize_app(cred)

def verify_firebase_token(id_token):
    """
    Verifica el token de Firebase recibido desde el cliente.
    Retorna el token decodificado si es válido o None en caso de error.
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        # En producción, registra el error de forma adecuada.
        return None
