from rest_framework import generics, parsers
from rest_framework.response import Response
from .models import Employe
from .serializers import EmployeSerializer, EmployeCreateSerializer
from authentication.permissions import EstAdmin, EstGerant


class EmployeListCreateView(generics.ListCreateAPIView):
    queryset = Employe.objects.select_related('utilisateur').order_by('-created_at')
    permission_classes = [EstGerant]
    pagination_class = None
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EmployeCreateSerializer
        return EmployeSerializer


class EmployeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employe.objects.select_related('utilisateur')
    permission_classes = [EstAdmin]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return EmployeCreateSerializer
        return EmployeSerializer