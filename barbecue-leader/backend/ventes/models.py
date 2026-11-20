from django.db import models
from commandes.models import Commande
from authentication.models import Utilisateur


class Vente(models.Model):
    commande = models.OneToOneField(Commande, on_delete=models.CASCADE,
                                     related_name='vente')
    caissier = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True)
    montant_total = models.DecimalField(max_digits=10, decimal_places=2)
    montant_recu = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monnaie_rendue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date_vente = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Vente'
        verbose_name_plural = 'Ventes'
        ordering = ['-date_vente']

    def __str__(self):
        return f"Vente #{self.commande.numero} — {self.montant_total} FCFA"


class RapportJournalier(models.Model):
    date = models.DateField(unique=True)
    total_ventes = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nombre_commandes = models.IntegerField(default=0)
    total_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_mobile = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_credit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Rapport journalier'
        verbose_name_plural = 'Rapports journaliers'
        ordering = ['-date']

    def __str__(self):
        return f"Rapport du {self.date} — {self.total_ventes} FCFA"