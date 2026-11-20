from django.contrib import admin
from .models import Vente, RapportJournalier


@admin.register(Vente)
class VenteAdmin(admin.ModelAdmin):
    list_display = ['commande', 'caissier', 'montant_total', 'date_vente']
    list_filter = ['date_vente']