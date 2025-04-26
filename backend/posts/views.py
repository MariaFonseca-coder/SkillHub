from django.shortcuts import render

import os
import firebase_admin
from firebase_admin import credentials, storage
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile
import traceback

cred_path = os.path.join(settings.BASE_DIR, 'credentials', 'skillhub-603c7-firebase-adminsdk-fbsvc.json')
print("Verificando credenciales en:", cred_path)
print("¿Existe el archivo?:", os.path.exists(cred_path))

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'skillhub-603c7.appspot.com'
    })

@csrf_exempt
def upload_to_firebase(request):
    try:
        if request.method == 'POST' and 'file' in request.FILES:
            upload_file: InMemoryUploadedFile = request.FILES['file']
            file_name = upload_file.name.replace(" ", "_")
            path = f"posts/{file_name}"

            bucket = storage.bucket('skillhub-603c7.appspot.com')
            blob = bucket.blob(path)
            blob.upload_from_file(upload_file.file, content_type=upload_file.content_type)
            blob.make_public()
            return JsonResponse({'url': blob.public_url}, status=200)
        else:
            return JsonResponse({'error': 'Archivo no recibido'}, status=400)
    except Exception as e:
        print("Error en upload_to_firebase:", str(e))
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)
