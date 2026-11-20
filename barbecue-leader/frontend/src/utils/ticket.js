export const afficherTicket = (commande, vente, onImprimer, onFermer) => {
  const total = Number(vente.montant_total || commande.total)
  const recu = Number(vente.montant_recu || total)
  const monnaie = Number(vente.monnaie_rendue || 0)

  const modePaiement = {
    cash: 'Cash',
    mobile: 'Mobile Money',
    credit: 'Crédit',
  }[commande.mode_paiement] || commande.mode_paiement

  const lignes = (commande.lignes || []).map(l =>
    `<tr>
      <td style="padding:3px 0;font-size:12px;">${l.produit_nom}</td>
      <td style="padding:3px 0;font-size:12px;text-align:center;">${l.quantite}</td>
      <td style="padding:3px 0;font-size:12px;text-align:right;">${Number(l.prix_unitaire).toLocaleString()} F</td>
      <td style="padding:3px 0;font-size:12px;text-align:right;">${Number(l.sous_total).toLocaleString()} F</td>
    </tr>`
  ).join('')

  const ticketHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket #${commande.numero}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          width: 80mm;
          margin: 0 auto;
          padding: 10px;
          color: #000;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .separator { border-top: 1px dashed #000; margin: 8px 0; }
        .logo { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
        .subtitle { font-size: 11px; color: #555; }
        .numero { font-size: 13px; font-weight: bold; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; border-bottom: 1px solid #000; padding: 4px 0; text-align: left; }
        th:nth-child(2) { text-align: center; }
        th:nth-child(3), th:nth-child(4) { text-align: right; }
        .total-row td { font-weight: bold; font-size: 14px; padding-top: 6px; border-top: 1px solid #000; }
        .info { font-size: 11px; margin: 3px 0; }
        .merci { font-size: 13px; font-weight: bold; margin-top: 5px; }
        .footer { font-size: 10px; color: #777; margin-top: 3px; }
        @media print {
          body { width: 80mm; }
          @page { margin: 0; size: 80mm auto; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <img src="http://localhost:5173/src/assets/logoBL.png" style="width:60px;height:60px;object-fit:contain;" />
        <div class="logo">BARBECUE LEADER</div>
        <div class="subtitle">Gestion de snack — Douala</div>
      </div>
      <div class="separator"></div>
      <div class="center">
        <div class="numero">TICKET #${commande.numero}</div>
        <div class="info">${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        ${commande.table_numero ? `<div class="info">Table : <strong>${commande.table_numero}</strong></div>` : ''}
        ${commande.nom_client ? `<div class="info">Client : <strong>${commande.nom_client}</strong></div>` : ''}
      </div>
      <div class="separator"></div>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th>Qté</th>
            <th>P.U</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${lignes}
          <tr class="total-row">
            <td colspan="3">TOTAL</td>
            <td style="text-align:right;">${total.toLocaleString()} F</td>
          </tr>
        </tbody>
      </table>
      <div class="separator"></div>
      <div class="info">Mode de paiement : <strong>${modePaiement}</strong></div>
      <div class="info">Montant reçu : <strong>${recu.toLocaleString()} F</strong></div>
      ${monnaie > 0 ? `<div class="info">Monnaie rendue : <strong>${monnaie.toLocaleString()} F</strong></div>` : ''}
      <div class="separator"></div>
      <div class="center">
        <div class="merci">Merci de votre visite !</div>
        <div class="footer">À bientôt chez Barbecue Leader</div>
      </div>
    </body>
    </html>
  `

  return ticketHTML
}

export const imprimerTicket = (commande, vente) => {
  const html = afficherTicket(commande, vente)
  const fenetre = window.open('', '_blank', 'width=400,height=600')
  fenetre.document.write(html)
  fenetre.document.close()
  fenetre.focus()
  setTimeout(() => { fenetre.print() }, 500)
}