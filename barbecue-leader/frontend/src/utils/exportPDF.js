import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ORANGE = [249, 115, 22]
const DARK = [30, 30, 30]
const GRAY = [100, 100, 100]
const LIGHT_GRAY = [245, 245, 245]
const formatMontant = (val) => {
  return Number(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export const exportRapportVentesPDF = (data, dateDebut, dateFin) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // ── Header ──
  doc.setFillColor(...ORANGE)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('BARBECUE LEADER', 14, 15)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Rapport de ventes', 14, 23)
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    14, 30
  )

  // ── Période ──
  doc.setTextColor(...DARK)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Période analysée', 14, 50)
  doc.setDrawColor(...ORANGE)
  doc.setLineWidth(0.5)
  doc.line(14, 52, pageWidth - 14, 52)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text(
    `Du ${new Date(dateDebut + 'T00:00:00').toLocaleDateString('fr-FR')} au ${new Date(dateFin + 'T00:00:00').toLocaleDateString('fr-FR')}`,
    14, 60
  )

  // ── Résumé financier ──
  doc.setTextColor(...DARK)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Résumé financier', 14, 72)
  doc.setDrawColor(...ORANGE)
  doc.line(14, 74, pageWidth - 14, 74)

  const kpis = [
    { label: "Chiffre d'affaires total", valeur: `${formatMontant(data.total || 0)} FCFA` },
    { label: 'Bénéfice net estimé', valeur: `${formatMontant(Math.round(data.benefice || 0))} FCFA` },
    { label: 'Nombre de transactions', valeur: `${data.nombre || 0}` },
    { label: 'Panier moyen', valeur: `${formatMontant(Math.round(data.panier_moyen || 0))} FCFA` },
    { label: 'Taux de marge', valeur: data.total > 0 ? `${Math.round((data.benefice / data.total) * 100)}%` : '0%' },
 ]

  autoTable(doc, {
    startY: 80,
    head: [['Indicateur', 'Valeur']],
    body: kpis.map(k => [k.label, k.valeur]),
    headStyles: {
      fillColor: ORANGE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: DARK,
    },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: 'normal' },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold', textColor: ORANGE },
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 14, right: 14 },
    tableWidth: pageWidth - 28,
  })

  // ── Top produits ──
  if (data.top_produits && data.top_produits.length > 0) {
    const finalY = doc.lastAutoTable?.finalY || 150
    doc.setTextColor(...DARK)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Top produits vendus', 14, finalY + 15)
    doc.setDrawColor(...ORANGE)
    doc.line(14, finalY + 17, pageWidth - 14, finalY + 17)

    autoTable(doc, {
      startY: finalY + 23,
      head: [['#', 'Produit', 'Quantité vendue']],
      body: data.top_produits.map((p, i) => [
        i + 1,
        p.produit__nom,
        p.total_quantite,
      ]),
      headStyles: {
        fillColor: ORANGE,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9, textColor: DARK },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 130 },
        2: { cellWidth: 40, halign: 'center', fontStyle: 'bold', textColor: ORANGE },
      },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
    })
  }

  // ── Performance caissiers ──
  if (data.par_caissier && data.par_caissier.length > 0) {
    const finalY2 = doc.lastAutoTable?.finalY || 200
    doc.setTextColor(...DARK)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance par caissier', 14, finalY2 + 15)
    doc.setDrawColor(...ORANGE)
    doc.line(14, finalY2 + 17, pageWidth - 14, finalY2 + 17)

    autoTable(doc, {
      startY: finalY2 + 23,
      head: [['Caissier', 'Nb ventes', 'Total (FCFA)']],
      body: data.par_caissier.map(c => [
        `${c.caissier__first_name || ''} ${c.caissier__last_name || ''}`.trim() || 'N/A',
        c.nombre,
        `${formatMontant(Number(c.total))} FCFA`,
    
      ]),
      headStyles: {
        fillColor: ORANGE,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: { fontSize: 9, textColor: DARK },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 42, halign: 'right', fontStyle: 'bold', textColor: ORANGE },
      },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
    })
  }

  // ── Tableau détaillé des ventes ──
  if (data.ventes && data.ventes.length > 0) {
    doc.addPage()

    doc.setFillColor(...ORANGE)
    doc.rect(0, 0, pageWidth, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Détail des transactions', 14, 14)

    autoTable(doc, {
      startY: 28,
      head: [['N° Commande', 'Caissier', 'Paiement', 'Reçu (F)', 'Monnaie (F)', 'Total (F)', 'Heure']],
      body: data.ventes.map(v => [
        `#${v.commande_numero}`,
        v.caissier_nom || '—',
        v.mode_paiement === 'cash' ? 'Cash'
          : v.mode_paiement === 'mobile' ? 'Mobile Money'
          : 'Crédit',
        `${formatMontant(Number(v.montant_recu))} F`,
        `${formatMontant(Number(v.monnaie_rendue))} F`,
        `${formatMontant(Number(v.montant_total))} F`,
        new Date(v.date_vente).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      ]),
      headStyles: {
        fillColor: ORANGE,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: DARK },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 28 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: ORANGE },
        6: { cellWidth: 18, halign: 'center' },
      },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
      foot: [['', '', '', '', 'TOTAL', `${formatMontant(data.total || 0)} F`, '']],
      footStyles: {
        fillColor: DARK,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'right',
      },
    })
  }

  // ── Footer sur chaque page ──
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Barbecue Leader — Rapport de ventes — Page ${i} / ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
    doc.setDrawColor(...ORANGE)
    doc.setLineWidth(0.3)
    doc.line(14, doc.internal.pageSize.getHeight() - 12, pageWidth - 14, doc.internal.pageSize.getHeight() - 12)
  }

  // ── Sauvegarde ──
  const fileName = `rapport_ventes_${dateDebut}_${dateFin}.pdf`
  doc.save(fileName)
}