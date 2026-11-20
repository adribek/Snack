from django.contrib import admin
from .models import Commande, LigneCommande


class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 0


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ['numero', 'caissier', 'statut', 'mode_paiement', 'created_at']
    list_filter = ['statut', 'mode_paiement']
    inlines = [LigneCommandeInline]