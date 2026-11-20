from django.urls import path
from .views import (CommandeListCreateView, CommandeDetailView,
                    encaisser_commande, changer_statut_commande, tables_statuts)

urlpatterns = [
    path('', CommandeListCreateView.as_view(), name='commandes'),
    path('<int:pk>/', CommandeDetailView.as_view(), name='commande_detail'),
    path('<int:pk>/encaisser/', encaisser_commande, name='encaisser'),
    path('<int:pk>/statut/', changer_statut_commande, name='changer_statut'),
    path('tables/', tables_statuts, name='tables_statuts'),
]