from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import F
from .models import MouvementStock
from .serializers import MouvementStockSerializer, AjustementStockSerializer
from authentication.permissions import EstGerant, EstCaissier
from produits.models import Produit
from produits.serializers import ProduitSerializer


class MouvementStockListView(generics.ListAPIView):
    serializer_class = MouvementStockSerializer
    permission_classes = [EstCaissier]
    pagination_class = None

    def get_queryset(self):
        queryset = MouvementStock.objects.select_related(
            'produit', 'effectue_par').order_by('-created_at')
        produit_id = self.request.query_params.get('produit')
        type_mv = self.request.query_params.get('type')
        if produit_id:
            queryset = queryset.filter(produit_id=produit_id)
        if type_mv:
            queryset = queryset.filter(type_mouvement=type_mv)
        return queryset


@api_view(['POST'])
@permission_classes([EstGerant])
def ajuster_stock(request):
    serializer = AjustementStockSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    data = serializer.validated_data
    try:
        produit = Produit.objects.get(pk=data['produit'])
    except Produit.DoesNotExist:
        return Response({'erreur': 'Produit introuvable'}, status=404)

    stock_avant = produit.stock_actuel
    quantite = data['quantite']
    type_mv = data['type_mouvement']

    if type_mv == 'entree':
        produit.stock_actuel += quantite
    elif type_mv == 'perte':
        produit.stock_actuel = max(0, produit.stock_actuel - quantite)
    elif type_mv == 'ajustement':
        produit.stock_actuel = quantite

    produit.save()

    MouvementStock.objects.create(
        produit=produit,
        type_mouvement=type_mv,
        quantite=quantite,
        stock_avant=stock_avant,
        stock_apres=produit.stock_actuel,
        motif=data.get('motif', ''),
        effectue_par=request.user
    )

    return Response({
        'message': 'Stock mis à jour',
        'stock_avant': stock_avant,
        'stock_apres': produit.stock_actuel
    })


@api_view(['GET'])
@permission_classes([EstCaissier])
def alertes_stock(request):
    produits = Produit.objects.filter(
        stock_actuel__lte=F('stock_minimum'),
        est_actif=True
    ).select_related('categorie')
    serializer = ProduitSerializer(produits, many=True)
    return Response(serializer.data)