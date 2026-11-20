from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Categorie, Produit
from .serializers import CategorieSerializer, ProduitSerializer, ProduitCreateSerializer
from authentication.permissions import EstGerant
from rest_framework import parsers


class CategorieListCreateView(generics.ListCreateAPIView):
    queryset = Categorie.objects.all().order_by('nom')
    serializer_class = CategorieSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [EstGerant()]


class CategorieDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [EstGerant]


class ProduitListCreateView(generics.ListCreateAPIView):
    queryset = Produit.objects.select_related('categorie').order_by('nom')
    pagination_class = None
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [EstGerant()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProduitCreateSerializer
        return ProduitSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        categorie = self.request.query_params.get('categorie')
        actif = self.request.query_params.get('actif')
        stock_bas = self.request.query_params.get('stock_bas')
        if categorie:
            queryset = queryset.filter(categorie_id=categorie)
        if actif is not None:
            queryset = queryset.filter(est_actif=actif == 'true')
        if stock_bas == 'true':
            from django.db.models import F
            queryset = queryset.filter(stock_actuel__lte=F('stock_minimum'))
        return queryset


class ProduitDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Produit.objects.select_related('categorie')
    permission_classes = [EstGerant]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProduitCreateSerializer
        return ProduitSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def produits_actifs(request):
    produits = Produit.objects.filter(est_actif=True).select_related('categorie').order_by('categorie__nom', 'nom')
    serializer = ProduitSerializer(produits, many=True)
    return Response(serializer.data)

# Create your views here.
