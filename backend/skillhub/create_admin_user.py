import requests
import json
import firebase_admin
from firebase_admin import credentials, auth
import getpass
import os

def get_id_token(custom_token, api_key):
    """
    Intercambia el custom token por un ID token válido usando la API REST de Firebase.
    """
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"
    payload = {
        "token": custom_token.decode('utf-8') if isinstance(custom_token, bytes) else custom_token,
        "returnSecureToken": True
    }
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        return response.json()["idToken"]
    else:
        raise Exception("Error al intercambiar el custom token por ID token: " + response.text)

def register_admin(token, username, full_name, location, email, password):
    """
    Envía una petición POST al endpoint de registro de usuarios admin.
    
    Args:
        token (str): ID token de Firebase válido.
        username (str): Nombre de usuario para el registro.
        full_name (str): Nombre completo del usuario.
        location (str): Ubicación o localidad del usuario.
        email (str): Correo electrónico del usuario.
        password (str): Contraseña del usuario.
    """
    url = "http://localhost:8000/api/firebase-signup/"
    payload = {
        "token": token,
        "role": "admin",  # Se fuerza el rol admin
        "username": username,
        "full_name": full_name,
        "location": location,
        "email": email,
        "password": password
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 201:
            print("Registro exitoso:")
            print(json.dumps(response.json(), indent=4))
        else:
            print(f"Error en el registro: {response.status_code}")
            print(response.text)
    except Exception as e:
        print("Ocurrió un error al conectar con el endpoint:", e)

if __name__ == "__main__":
    
    # Configuración: ruta al archivo de credenciales y API_KEY de Firebase
    os.chdir("..")
    service_account_path = os.path.join(os.getcwd(), 'credentials', 'skillhub-603c7-firebase-adminsdk-fbsvc-0797b64710.json')

    api_key = 'AIzaSyD7NCQcoFdWL7PLX1YUJpCiMyon73jPKwY'
    
    # Inicializa Firebase Admin SDK
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)
    
    # Solicita datos del usuario por consola
    username = input("Ingrese username: ")
    full_name = input("Ingrese nombre completo: ")
    location = input("Ingrese ubicación: ")
    email = input("Ingrese correo: ")
    password = getpass.getpass("Ingrese contraseña: ")
    
    # Verifica si el usuario ya existe en Firebase Authentication; si no, lo crea.
    try:
        user = auth.get_user_by_email(email)
        print(f"El usuario {email} ya existe en Firebase Authentication.")
    except firebase_admin.auth.UserNotFoundError:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=full_name
        )
        print(f"Usuario {email} creado en Firebase Authentication.")
    
    # Genera automáticamente un custom token para el usuario usando su uid
    custom_token = auth.create_custom_token(user.uid)
    print("Custom token generado:", custom_token)
    
    try:
        # Intercambia el custom token por un ID token válido
        id_token = get_id_token(custom_token, api_key)
        print("ID Token obtenido:", id_token)
    except Exception as e:
        print("Error al obtener el ID token:", e)
        exit(1)
    
    # Envía la petición de registro al endpoint de Django
    register_admin(id_token, username, full_name, location, email, password)
