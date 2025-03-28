from django.shortcuts import render, redirect

def index(request):
    """Renderiza la plantilla principal."""
    return render(request, 'index.html')

def redirect_index(request):
    """
    Función que redirige a la vista 'index'.
    Esta función puede usarse para la ruta raíz ("/") en el archivo urls.py.
    """
    return redirect('index')