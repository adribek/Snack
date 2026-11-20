from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/produits/', include('produits.urls')),
    path('api/commandes/', include('commandes.urls')),
    path('api/stock/', include('stock.urls')),
    path('api/ventes/', include('ventes.urls')),
    path('api/employes/', include('employes.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)