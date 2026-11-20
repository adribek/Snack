from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'est_actif']
    list_filter = ['role', 'est_actif']
    fieldsets = UserAdmin.fieldsets + (
        ('Informations snack', {'fields': ('role', 'telephone', 'est_actif')}),
    )
    