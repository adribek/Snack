from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Commande, LigneCommande
from .serializers import CommandeSerializer, CommandeCreateSerializer
from authentication.permissions import EstCaissier, EstGerant, EstServeuse
from produits.models import Produit


class CommandeListCreateView(generics.ListCreateAPIView):
    permission_classes = [EstServeuse]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommandeCreateSerializer
        return CommandeSerializer

    def get_queryset(self):
        queryset = Commande.objects.prefetch_related(
            'lignes__produit').order_by('-created_at')
        statut = self.request.query_params.get('statut')
        user = self.request.user
        if statut:
            queryset = queryset.filter(statut=statut)
        # La serveuse ne voit que ses propres commandes
        if user.role == 'serveuse':
            queryset = queryset.filter(caissier=user)
        return queryset


class CommandeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Commande.objects.prefetch_related('lignes__produit')
    permission_classes = [EstServeuse]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CommandeCreateSerializer
        return CommandeSerializer

from django.db import transaction

@api_view(['POST'])
@permission_classes([EstCaissier])
def encaisser_commande(request, pk):
    from ventes.models import Vente
    from stock.models import MouvementStock
    from produits.models import Produit

    mode_paiement = request.data.get('mode_paiement', 'cash')
    montant_recu = float(request.data.get('montant_recu', 0) or 0)

    with transaction.atomic():
        try:
            commande = Commande.objects.select_for_update().get(pk=pk)
        except Commande.DoesNotExist:
            return Response({'erreur': 'Commande introuvable'}, status=404)

        if commande.statut == 'payee' or Vente.objects.filter(commande=commande).exists():
            return Response({'erreur': 'Cette commande est déjà encaissée'}, status=400)
        if commande.statut == 'annulee':
            return Response({'erreur': 'Cette commande est annulée'}, status=400)

        # Quantité totale demandée par produit
        besoins = {}
        for ligne in commande.lignes.all():
            if ligne.produit_id:
                besoins[ligne.produit_id] = besoins.get(ligne.produit_id, 0) + ligne.quantite

        # Verrouille les produits pour éviter deux encaissements simultanés
        produits = {p.id: p for p in Produit.objects.select_for_update().filter(id__in=besoins)}

        manques = [
            f"{produits[i].nom} (stock {produits[i].stock_actuel}, demandé {q})"
            for i, q in besoins.items()
            if produits[i].stock_actuel < q
        ]
        if manques:
            return Response({'erreur': 'Stock insuffisant : ' + ', '.join(manques)}, status=400)

        for pid, qte in besoins.items():
            produit = produits[pid]
            avant = produit.stock_actuel
            produit.stock_actuel = avant - qte
            produit.save()
            MouvementStock.objects.create(
                produit=produit, type_mouvement='sortie', quantite=qte,
                stock_avant=avant, stock_apres=produit.stock_actuel,
                motif=f'Vente commande #{commande.numero}',
                effectue_par=request.user,
            )

        total = commande.total
        Vente.objects.create(
            commande=commande, caissier=request.user,
            montant_total=total, montant_recu=montant_recu,
            monnaie_rendue=max(0, montant_recu - float(total)),
        )
        commande.statut = 'payee'
        commande.mode_paiement = mode_paiement
        commande.save()

    return Response({'message': 'Commande encaissée avec succès', 'total': str(total)})

@api_view(['PATCH'])
@permission_classes([EstServeuse])
def changer_statut_commande(request, pk):
    try:
        commande = Commande.objects.get(pk=pk)
    except Commande.DoesNotExist:
        return Response({'erreur': 'Commande introuvable'}, status=404)

    nouveau_statut = request.data.get('statut')
    statuts_autorises = ['en_attente', 'en_cours', 'servie']

    if request.user.role == 'serveuse' and nouveau_statut not in statuts_autorises:
        return Response({'erreur': 'Action non autorisée'}, status=403)

    commande.statut = nouveau_statut
    commande.save()
    return Response(CommandeSerializer(commande).data)


@api_view(['GET'])
@permission_classes([EstServeuse])
def tables_statuts(request):
    commandes_actives = Commande.objects.filter(
        statut__in=['en_attente', 'en_cours', 'servie']
    ).exclude(table_numero='').values('table_numero', 'statut', 'id', 'numero')

    tables = {}
    for cmd in commandes_actives:
        table = cmd['table_numero']
        if table not in tables:
            tables[table] = {
                'table': table,
                'statut': cmd['statut'],
                'commande_id': cmd['id'],
                'commande_numero': cmd['numero'],
            }

    return Response(list(tables.values()))