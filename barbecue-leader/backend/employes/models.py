from django.db import models
from authentication.models import Utilisateur


class Employe(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE,
                                        related_name='employe')
    numero_employe = models.CharField(max_length=20, unique=True)
    date_embauche = models.DateField()
    salaire = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    adresse = models.TextField(blank=True)
    photo = models.ImageField(upload_to='employes/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'

    def __str__(self):
        return f"{self.utilisateur.get_full_name()} — {self.numero_employe}"