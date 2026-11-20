from rest_framework import serializers
from .models import Employe
from authentication.serializers import UtilisateurSerializer

ROLES_CHOICES = ['admin', 'gerant', 'caissier', 'serveuse', 'securite', 'manager', 'cuisinier', 'dj', 'chef_salle', 'directeur' ]

class EmployeSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)

    class Meta:
        model = Employe
        fields = ['id', 'utilisateur', 'numero_employe', 'date_embauche',
                  'salaire', 'adresse', 'photo', 'created_at']


class EmployeCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=ROLES_CHOICES,
        write_only=True,
        default='caissier'
    )
    telephone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Employe
        fields = ['username', 'password', 'first_name', 'last_name', 'email',
                  'role', 'telephone', 'numero_employe', 'date_embauche',
                  'salaire', 'adresse', 'photo']

    def create(self, validated_data):
        from authentication.models import Utilisateur
        user_data = {
            'username': validated_data.pop('username'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'email': validated_data.pop('email', ''),
            'role': validated_data.pop('role', 'caissier'),
            'telephone': validated_data.pop('telephone', ''),
        }
        password = validated_data.pop('password')
        user = Utilisateur(**user_data)
        user.set_password(password)
        user.save()
        employe = Employe.objects.create(utilisateur=user, **validated_data)
        return employe