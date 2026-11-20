from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import datetime, date, timedelta
from .models import Vente, RapportJournalier
from .serializers import VenteSerializer, RapportJournalierSerializer
from authentication.permissions import EstGerant, EstCaissier


class VenteListView(generics.ListAPIView):
    serializer_class = VenteSerializer
    permission_classes = [EstCaissier]
    pagination_class = None

    def get_queryset(self):
        queryset = Vente.objects.select_related(
            'commande', 'caissier').order_by('-date_vente')
        date_str = self.request.query_params.get('date')
        if date_str:
            queryset = queryset.filter(date_vente__date=date_str)
        return queryset


@api_view(['GET'])
@permission_classes([EstCaissier])
def dashboard_stats(request):
    aujourd_hui = date.today()

    ventes_jour = Vente.objects.filter(date_vente__date=aujourd_hui)
    total_jour = ventes_jour.aggregate(total=Sum('montant_total'))['total'] or 0
    nb_commandes_jour = ventes_jour.count()

    ventes_mois = Vente.objects.filter(
        date_vente__year=aujourd_hui.year,
        date_vente__month=aujourd_hui.month
    )
    total_mois = ventes_mois.aggregate(total=Sum('montant_total'))['total'] or 0

    from produits.models import Produit
    from django.db.models import F
    stock_bas = Produit.objects.filter(
        stock_actuel__lte=F('stock_minimum'), est_actif=True).count()

    sept_jours = []
    for i in range(6, -1, -1):
        jour = aujourd_hui - timedelta(days=i)
        total = Vente.objects.filter(
            date_vente__date=jour
        ).aggregate(total=Sum('montant_total'))['total'] or 0
        sept_jours.append({
            'date': jour.strftime('%d/%m'),
            'total': float(total)
        })

    # Bénéfice du jour
    from commandes.models import LigneCommande
    from django.db.models import F, ExpressionWrapper, DecimalField

    benefice_jour = LigneCommande.objects.filter(
        commande__statut='payee',
        commande__vente__date_vente__date=aujourd_hui
    ).annotate(
        benefice_ligne=ExpressionWrapper(
            (F('prix_unitaire') - F('produit__prix_achat')) * F('quantite'),
            output_field=DecimalField()
        )
    ).aggregate(total=Sum('benefice_ligne'))['total'] or 0

    paiements = {}
    for v in ventes_jour:
        mode = v.commande.mode_paiement or 'cash'
        paiements[mode] = paiements.get(mode, 0) + float(v.montant_total)

    return Response({
        'total_jour': float(total_jour),
        'nb_commandes_jour': nb_commandes_jour,
        'total_mois': float(total_mois),
        'stock_bas': stock_bas,
        'ventes_7_jours': sept_jours,
        'benefice_jour': float(benefice_jour),
        'paiements': paiements,
    })


@api_view(['GET'])
@permission_classes([EstCaissier])
def ventes_journalier(request):
    date_str = request.query_params.get('date', date.today().isoformat())
    try:
        jour = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'erreur': 'Format de date invalide'}, status=400)

    ventes = Vente.objects.filter(
        date_vente__date=jour
    ).select_related('commande', 'caissier').order_by('-date_vente')

    serializer = VenteSerializer(ventes, many=True)
    total = ventes.aggregate(total=Sum('montant_total'))['total'] or 0

    return Response({
        'date': date_str,
        'ventes': serializer.data,
        'total': float(total),
        'nombre': ventes.count(),
    })


@api_view(['GET'])
@permission_classes([EstCaissier])
def ventes_periode(request):
    date_debut = request.query_params.get('date_debut')
    date_fin = request.query_params.get('date_fin')
    mode_paiement = request.query_params.get('mode_paiement')

    queryset = Vente.objects.select_related('commande', 'caissier').order_by('-date_vente')

    if date_debut:
        queryset = queryset.filter(date_vente__date__gte=date_debut)
    if date_fin:
        queryset = queryset.filter(date_vente__date__lte=date_fin)
    if mode_paiement:
        queryset = queryset.filter(commande__mode_paiement=mode_paiement)

    from django.db.models import Sum, Count, F, ExpressionWrapper, DecimalField
    from commandes.models import LigneCommande

    total = queryset.aggregate(total=Sum('montant_total'))['total'] or 0
    nb_ventes = queryset.count()
    panier_moyen = total / nb_ventes if nb_ventes > 0 else 0

    # Calcul bénéfice
    filtres_benefice = {}
    if date_debut:
        filtres_benefice['commande__vente__date_vente__date__gte'] = date_debut
    if date_fin:
        filtres_benefice['commande__vente__date_vente__date__lte'] = date_fin

    benefice_data = LigneCommande.objects.filter(
        commande__statut='payee',
        **filtres_benefice
    ).annotate(
        benefice_ligne=ExpressionWrapper(
            (F('prix_unitaire') - F('produit__prix_achat')) * F('quantite'),
            output_field=DecimalField()
        )
    ).aggregate(total_benefice=Sum('benefice_ligne'))

    total_benefice = float(benefice_data['total_benefice'] or 0)

    serializer = VenteSerializer(queryset, many=True)

    from commandes.models import LigneCommande
    filtres_lignes = {}
    if date_debut:
        filtres_lignes['commande__vente__date_vente__date__gte'] = date_debut
    if date_fin:
        filtres_lignes['commande__vente__date_vente__date__lte'] = date_fin

    top_produits = LigneCommande.objects.filter(
        commande__statut='payee', **filtres_lignes
    ).values('produit__nom').annotate(
        total_quantite=Sum('quantite')
    ).order_by('-total_quantite')[:5]

    par_caissier = queryset.values(
        'caissier__first_name', 'caissier__last_name'
    ).annotate(
        total=Sum('montant_total'),
        nombre=Count('id')
    ).order_by('-total')

    return Response({
        'ventes': serializer.data,
        'total': float(total),
        'nombre': nb_ventes,
        'panier_moyen': float(panier_moyen),
        'benefice': total_benefice,
        'top_produits': list(top_produits),
        'par_caissier': list(par_caissier),
    })