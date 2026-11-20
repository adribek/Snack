from django.urls import path
from .views import EmployeListCreateView, EmployeDetailView

urlpatterns = [
    path('', EmployeListCreateView.as_view(), name='employes'),
    path('<int:pk>/', EmployeDetailView.as_view(), name='employe_detail'),
]