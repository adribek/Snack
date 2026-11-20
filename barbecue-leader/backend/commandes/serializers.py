from rest_framework import serializers
from .models import Commande, LigneCommande
from produits.serializers import ProduitSerializer


class LigneCommandeSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    sous_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = LigneCommande
        fields = ['id', 'produit', 'produit_nom', 'quantite',
                  'prix_unitaire', 'note', 'sous_total']


class LigneCommandeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneCommande
        fields = ['produit', 'quantite', 'prix_unitaire', 'note']


class CommandeSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    caissier_nom = serializers.CharField(source='caissier.get_full_name', read_only=True)

    class Meta:
        model = Commande
        fields = ['id', 'numero', 'caissier', 'caissier_nom', 'statut',
                  'mode_paiement', 'nom_client', 'table_numero', 'note',
                  'remise', 'total', 'lignes', 'created_at']


class CommandeCreateSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeCreateSerializer(many=True)

    class Meta:
        model = Commande
        fields = ['nom_client', 'table_numero', 'note', 'remise', 'lignes']

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        commande = Commande.objects.create(
        caissier=self.context['request'].user,
        **validated_data
    )
        for ligne_data in lignes_data:
            LigneCommande.objects.create(commande=commande, **ligne_data)
        return commande

    def to_representation(self, instance):
        return CommandeSerializer(instance, context=self.context).data