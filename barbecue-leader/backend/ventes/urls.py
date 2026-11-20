from django.urls import path
from .views import VenteListView, dashboard_stats, ventes_journalier, ventes_periode

urlpatterns = [
    path('', VenteListView.as_view(), name='ventes'),
    path('dashboard/', dashboard_stats, name='dashboard_stats'),
    path('journalier/', ventes_journalier, name='ventes_journalier'),
    path('periode/', ventes_periode, name='ventes_periode'),
]