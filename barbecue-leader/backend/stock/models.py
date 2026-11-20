from django.db import models
from produits.models import Produit
from authentication.models import Utilisateur


class MouvementStock(models.Model):
    TYPE_CHOICES = [
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
        ('ajustement', 'Ajustement'),
        ('perte', 'Perte'),
    ]

    produit = models.ForeignKey(Produit, on_delete=models.CASCADE,
                                 related_name='mouvements')
    type_mouvement = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantite = models.IntegerField()
    stock_avant = models.IntegerField()
    stock_apres = models.IntegerField()
    motif = models.CharField(max_length=200, blank=True)
    effectue_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Mouvement de stock'
        verbose_name_plural = 'Mouvements de stock'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_mouvement_display()} — {self.produit.nom} ({self.quantite})"