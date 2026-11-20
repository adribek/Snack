from django.urls import path
from .views import (CategorieListCreateView, CategorieDetailView,
                    ProduitListCreateView, ProduitDetailView, produits_actifs)

urlpatterns = [
    path('', ProduitListCreateView.as_view(), name='produits'),
    path('<int:pk>/', ProduitDetailView.as_view(), name='produit_detail'),
    path('actifs/', produits_actifs, name='produits_actifs'),
    path('categories/', CategorieListCreateView.as_view(), name='categories'),
    path('categories/<int:pk>/', CategorieDetailView.as_view(), name='categorie_detail'),
]