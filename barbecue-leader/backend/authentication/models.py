from django.contrib.auth.models import AbstractUser
from django.db import models


class Utilisateur(AbstractUser):
    role = models.CharField(max_length=50, default='caissier')
    telephone = models.CharField(max_length=20, blank=True)
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def est_admin(self):
        return self.role == 'admin'

    @property
    def est_gerant(self):
        return self.role in ['admin', 'gerant']