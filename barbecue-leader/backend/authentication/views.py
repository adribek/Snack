from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from .models import Utilisateur
from .serializers import (UtilisateurSerializer, UtilisateurCreateSerializer,
                           CustomTokenObtainPairSerializer, UtilisateurUpdateSerializer)
from .permissions import EstAdmin


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            jwt_settings = getattr(settings, 'SIMPLE_JWT', {})

            response.set_cookie(
                key=jwt_settings.get('AUTH_COOKIE', 'access_token'),
                value=access_token,
                max_age=int(jwt_settings.get('ACCESS_TOKEN_LIFETIME').total_seconds()),
                httponly=jwt_settings.get('AUTH_COOKIE_HTTP_ONLY', True),
                samesite=jwt_settings.get('AUTH_COOKIE_SAMESITE', 'Lax'),
                secure=jwt_settings.get('AUTH_COOKIE_SECURE', False),
            )

            response.set_cookie(
                key=jwt_settings.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                value=refresh_token,
                max_age=int(jwt_settings.get('REFRESH_TOKEN_LIFETIME').total_seconds()),
                httponly=jwt_settings.get('AUTH_COOKIE_HTTP_ONLY', True),
                samesite=jwt_settings.get('AUTH_COOKIE_SAMESITE', 'Lax'),
                secure=jwt_settings.get('AUTH_COOKIE_SECURE', False),
            )

            response.data['access'] = access_token
            response.data['refresh'] = refresh_token

        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({'message': 'Déconnexion réussie'})
        jwt_settings = getattr(settings, 'SIMPLE_JWT', {})
        response.delete_cookie(jwt_settings.get('AUTH_COOKIE', 'access_token'))
        response.delete_cookie(jwt_settings.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
        return response


class MoiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)


class UtilisateurListCreateView(generics.ListCreateAPIView):
    queryset = Utilisateur.objects.all().order_by('-date_creation')
    permission_classes = [EstAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UtilisateurCreateSerializer
        return UtilisateurSerializer


class UtilisateurDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Utilisateur.objects.all()
    permission_classes = [EstAdmin]
    http_method_names = ['get', 'patch', 'delete']

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return UtilisateurUpdateSerializer
        return UtilisateurSerializer