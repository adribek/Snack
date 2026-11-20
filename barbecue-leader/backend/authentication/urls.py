from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, LogoutView, MoiView, UtilisateurListCreateView, UtilisateurDetailView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('moi/', MoiView.as_view(), name='moi'),
    path('utilisateurs/', UtilisateurListCreateView.as_view(), name='utilisateurs'),
    path('utilisateurs/<int:pk>/', UtilisateurDetailView.as_view(), name='utilisateur_detail'),
]