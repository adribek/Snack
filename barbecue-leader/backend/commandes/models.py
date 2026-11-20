from django.db import models
from authentication.models import Utilisateur
from produits.models import Produit


class Commande(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_cours', 'En cours'),
        ('servie', 'Servie'),
        ('payee', 'Payée'),
        ('annulee', 'Annulée'),
    ]

    MODE_PAIEMENT_CHOICES = [
        ('cash', 'Cash'),
        ('mobile', 'Mobile Money'),
        ('credit', 'Crédit'),
    ]

    numero = models.CharField(max_length=20, unique=True)
    caissier = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL,
                                  null=True, related_name='commandes')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    mode_paiement = models.CharField(max_length=20, choices=MODE_PAIEMENT_CHOICES,
                                      blank=True, null=True)
    nom_client = models.CharField(max_length=100, blank=True)
    table_numero = models.CharField(max_length=10, blank=True)
    note = models.TextField(blank=True)
    remise = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Commande #{self.numero}"

    @property
    def total(self):
        total = sum(ligne.sous_total for ligne in self.lignes.all())
        return total * (1 - self.remise / 100)

    def save(self, *args, **kwargs):
        if not self.numero:
            import datetime
            date = datetime.datetime.now().strftime('%Y%m%d')
            count = Commande.objects.filter(
                created_at__date=datetime.date.today()).count() + 1
            self.numero = f"CMD-{date}-{count:04d}"
        super().save(*args, **kwargs)


class LigneCommande(models.Model):
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey(Produit, on_delete=models.SET_NULL, null=True)
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'

    def __str__(self):
        return f"{self.quantite}x {self.produit.nom}"

    @property
    def sous_total(self):
        return self.quantite * self.prix_unitaire