from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Categorie, Produit


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ['nom', 'description', 'created_at']
    search_fields = ['nom']


@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ['nom', 'categorie', 'prix_vente', 'stock_actuel', 'est_actif']
    list_filter = ['categorie', 'est_actif']
    search_fields = ['nom']