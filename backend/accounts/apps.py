from django.apps import AppConfig
import threading

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
 
    def ready(self):
        from .admin.views import check_posts_periodically

        def start_loop():
            check_posts_periodically()  # Ejecuta el loop de verificación

        thread = threading.Thread(target=start_loop)
        thread.daemon = True
        thread.start()