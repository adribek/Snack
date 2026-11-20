from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Utilisateur

ROLES_CHOICES = [
    'admin', 'gerant', 'caissier', 'serveuse', 'securite',
    'manager', 'cuisinier', 'dj', 'chef_salle', 'directeur'
]

class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'telephone', 'est_actif', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class UtilisateurCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(
        choices=ROLES_CHOICES,
        default='caissier'
    )

    class Meta:
        model = Utilisateur
        fields = ['username', 'email', 'first_name', 'last_name',
                  'role', 'telephone', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Utilisateur(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UtilisateurUpdateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(
        choices=ROLES_CHOICES
    )

    class Meta:
        model = Utilisateur
        fields = ['username', 'email', 'first_name', 'last_name',
                  'role', 'telephone', 'est_actif']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UtilisateurSerializer(self.user).data
        return data