from django.db import models


class Categorie(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'

    def __str__(self):
        return self.nom


class Produit(models.Model):
    nom = models.CharField(max_length=200)
    categorie = models.ForeignKey(Categorie, on_delete=models.SET_NULL,
                                   null=True, related_name='produits')
    prix_vente = models.DecimalField(max_digits=10, decimal_places=2)
    prix_achat = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_actuel = models.IntegerField(default=0)
    stock_minimum = models.IntegerField(default=5)
    unite = models.CharField(max_length=20, default='unité')
    est_actif = models.BooleanField(default=True)
    image = models.ImageField(upload_to='produits/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'

    def __str__(self):
        return self.nom

    @property
    def stock_bas(self):
        return self.stock_actuel <= self.stock_minimum

    @property
    def marge(self):
        return self.prix_vente - self.prix_achat