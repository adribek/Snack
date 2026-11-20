from rest_framework import serializers
from .models import Categorie, Produit


class CategorieSerializer(serializers.ModelSerializer):
    nombre_produits = serializers.SerializerMethodField()

    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'description', 'nombre_produits', 'created_at']

    def get_nombre_produits(self, obj):
        return obj.produits.filter(est_actif=True).count()


class ProduitSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    stock_bas = serializers.BooleanField(read_only=True)
    marge = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Produit
        fields = ['id', 'nom', 'categorie', 'categorie_nom', 'prix_vente',
                  'prix_achat', 'stock_actuel', 'stock_minimum', 'unite',
                  'est_actif', 'image', 'stock_bas', 'marge', 'created_at']


class ProduitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = ['nom', 'categorie', 'prix_vente', 'prix_achat',
                  'stock_actuel', 'stock_minimum', 'unite', 'est_actif', 'image']