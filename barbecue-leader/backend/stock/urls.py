from django.urls import path
from .views import MouvementStockListView, ajuster_stock, alertes_stock

urlpatterns = [
    path('', MouvementStockListView.as_view(), name='mouvements_stock'),
    path('ajuster/', ajuster_stock, name='ajuster_stock'),
    path('alertes/', alertes_stock, name='alertes_stock'),
]