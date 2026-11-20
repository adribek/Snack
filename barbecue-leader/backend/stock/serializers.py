from rest_framework import serializers
from .models import MouvementStock
from produits.serializers import ProduitSerializer


class MouvementStockSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    effectue_par_nom = serializers.CharField(
        source='effectue_par.get_full_name', read_only=True)

    class Meta:
        model = MouvementStock
        fields = ['id', 'produit', 'produit_nom', 'type_mouvement',
                  'quantite', 'stock_avant', 'stock_apres', 'motif',
                  'effectue_par_nom', 'created_at']


class AjustementStockSerializer(serializers.Serializer):
    produit = serializers.IntegerField()
    type_mouvement = serializers.ChoiceField(choices=['entree', 'ajustement', 'perte'])
    quantite = serializers.IntegerField(min_value=1)
    motif = serializers.CharField(max_length=200, required=False, allow_blank=True)