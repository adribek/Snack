from django.contrib import admin
from .models import Employe


@admin.register(Employe)
class EmployeAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'numero_employe', 'date_embauche', 'salaire']
    search_fields = ['utilisateur__username', 'numero_employe']