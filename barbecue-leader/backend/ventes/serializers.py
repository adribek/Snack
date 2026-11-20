from rest_framework import serializers
from .models import Vente, RapportJournalier


class VenteSerializer(serializers.ModelSerializer):
    commande_numero = serializers.CharField(source='commande.numero', read_only=True)
    caissier_nom = serializers.CharField(source='caissier.get_full_name', read_only=True)
    mode_paiement = serializers.CharField(source='commande.mode_paiement', read_only=True)

    class Meta:
        model = Vente
        fields = ['id', 'commande', 'commande_numero', 'caissier_nom',
                  'montant_total', 'montant_recu', 'monnaie_rendue',
                  'mode_paiement', 'date_vente']


class RapportJournalierSerializer(serializers.ModelSerializer):
    class Meta:
        model = RapportJournalier
        fields = '__all__'