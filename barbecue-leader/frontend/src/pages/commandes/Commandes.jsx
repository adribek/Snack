import { useState, useEffect } from 'react'
import { commandesService } from '../../services/api'
import { imprimerTicket } from '../../utils/ticket'
import ModalTicket from '../../components/ModalTicket'

const STATUTS = {
  en_attente: { label: 'En attente', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  en_cours: { label: 'En cours', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  servie: { label: 'Servie', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  payee: { label: 'Payée', bg: 'bg-green-500/10', text: 'text-green-400' },
  annulee: { label: 'Annulée', bg: 'bg-red-500/10', text: 'text-red-400' },
}

const PAIEMENTS = {
  cash: { label: '💵 Cash', bg: 'bg-green-500/10', text: 'text-green-400' },
  mobile: { label: '📱 Mobile', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  credit: { label: '📝 Crédit', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
}

export default function Commandes() {
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [commandeDetail, setCommandeDetail] = useState(null)
  const [erreur, setErreur] = useState('')
  const [modePaiement, setModePaiement] = useState('cash')
  const [montantRecu, setMontantRecu] = useState('')
  const [showTicket, setShowTicket] = useState(false)
  const [ticketData, setTicketData] = useState(null)

  useEffect(() => { charger() }, [filtreStatut])

  const charger = async () => {
    try {
      const params = filtreStatut ? `?statut=${filtreStatut}` : ''
      const { data } = await commandesService.liste()
      setCommandes(data.results || data)
    } catch {
      setErreur('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }
  const encaisserCommande = async (id) => {
    setErreur('')
    try {
      await commandesService.encaisser(id, {
        mode_paiement: modePaiement,
        montant_recu: parseFloat(montantRecu) || parseFloat(commandeDetail.total),
      })

      setTicketData({
        commande: { ...commandeDetail, mode_paiement: modePaiement },
        vente: {
          montant_total: commandeDetail.total,
          montant_recu: parseFloat(montantRecu) || parseFloat(commandeDetail.total),
          monnaie_rendue: montantRecu ? parseFloat(montantRecu) - parseFloat(commandeDetail.total) : 0,
        }
      })

      setSuccess('Commande encaissée avec succès !')
      setCommandeDetail(null)
      setMontantRecu('')
      setModePaiement('cash')
      setFiltreStatut('')
      setShowTicket(true)
      await charger()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      const msg = e.response?.data?.erreur || ''
      if (msg.includes('déjà')) {
        setSuccess('Commande déjà encaissée !')
        setCommandeDetail(null)
        setFiltreStatut('')
        await charger()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setErreur('Erreur lors de l\'encaissement')
        setTimeout(() => setErreur(''), 3000)
      }
    }
  }

  const changerStatut = async (id, statut) => {
    try {
      await commandesService.changerStatut(id, statut)
      charger()
      if (commandeDetail?.id === id) {
        setCommandeDetail(prev => ({ ...prev, statut }))
      }
    } catch {
      setErreur('Erreur lors du changement de statut')
    }
  }

  const commandesFiltrees = filtreStatut
    ? commandes.filter(c => c.statut === filtreStatut)
    : commandes

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Chargement des commandes...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Commandes</h1>
          <p className="text-gray-500 text-sm mt-1">{commandes.length} commande(s) au total</p>
        </div>
      </div>

      {erreur && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          {erreur}
        </div>
      )}

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltreStatut('')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            !filtreStatut ? 'bg-orange-500 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600'
          }`}>
          Toutes ({commandes.length})
        </button>
        {Object.entries(STATUTS).map(([key, val]) => (
          <button key={key} onClick={() => setFiltreStatut(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filtreStatut === key ? 'bg-orange-500 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600'
            }`}>
            {val.label} ({commandes.filter(c => c.statut === key).length})
          </button>
        ))}
      </div>

      {/* Liste commandes */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/30">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Commande</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Caissier</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Statut</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Paiement</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Total</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {commandesFiltrees.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    <span className="text-4xl">📋</span>
                    <p className="text-sm">Aucune commande trouvée</p>
                  </div>
                </td>
              </tr>
            ) : (
              commandesFiltrees.map(c => {
                const statut = STATUTS[c.statut] || STATUTS.en_attente
                const paiement = PAIEMENTS[c.mode_paiement]
                return (
                  <tr key={c.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4">
                      <span className="text-orange-400 font-semibold text-sm">#{c.numero}</span>
                      {c.table_numero && (
                        <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          Table {c.table_numero}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {c.nom_client || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{c.caissier_nom || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statut.bg} ${statut.text}`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {paiement ? (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${paiement.bg} ${paiement.text}`}>
                          {paiement.label}
                        </span>
                      ) : <span className="text-gray-600 text-sm">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right text-white font-bold text-sm">
                      {Number(c.total).toLocaleString()} F
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 text-sm">
                      {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      <br />
                      <span className="text-xs">
                        {new Date(c.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setCommandeDetail(c)}
                        className="text-blue-400 hover:text-blue-300 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition font-medium">
                        Détails
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal détail commande */}
      {commandeDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
              <div>
                <h2 className="text-lg font-bold text-white">Commande #{commandeDetail.numero}</h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  {new Date(commandeDetail.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <button onClick={() => setCommandeDetail(null)}
                className="text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Infos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">Client</p>
                  <p className="text-white text-sm font-medium">{commandeDetail.nom_client || 'Anonyme'}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">Table</p>
                  <p className="text-white text-sm font-medium">{commandeDetail.table_numero || '—'}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">Caissier</p>
                  <p className="text-white text-sm font-medium">{commandeDetail.caissier_nom || '—'}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">Statut</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUTS[commandeDetail.statut]?.bg} ${STATUTS[commandeDetail.statut]?.text}`}>
                    {STATUTS[commandeDetail.statut]?.label}
                  </span>
                </div>
              </div>

              {/* Lignes commande */}
              <div>
                <p className="text-gray-400 text-sm font-medium mb-3">Articles commandés</p>
                <div className="space-y-2">
                  {(commandeDetail.lignes || []).map(ligne => (
                    <div key={ligne.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{ligne.produit_nom}</p>
                        <p className="text-gray-500 text-xs">{Number(ligne.prix_unitaire).toLocaleString()} F × {ligne.quantite}</p>
                      </div>
                      <span className="text-orange-400 font-bold text-sm">
                        {Number(ligne.sous_total).toLocaleString()} F
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                <span className="text-orange-400 font-semibold">Total</span>
                <span className="text-orange-400 font-bold text-xl">{Number(commandeDetail.total).toLocaleString()} F</span>
              </div>

              {/* Changer statut */}
              {commandeDetail.statut !== 'payee' && commandeDetail.statut !== 'annulee' && (
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">Changer le statut</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUTS)
                      .filter(([key]) => key !== commandeDetail.statut && key !== 'payee')
                      .map(([key, val]) => (
                        <button key={key}
                          onClick={() => changerStatut(commandeDetail.id, key)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${val.bg} ${val.text} hover:opacity-80`}>
                          {val.label}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {/* Bouton encaisser */}
              {commandeDetail.statut === 'servie' && (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Encaissement
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        Mode de paiement
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[['cash', '💵', 'Cash'], ['mobile', '📱', 'Mobile'], ['credit', '📝', 'Crédit']].map(([val, icon, label]) => (
                          <button key={val} type="button"
                            onClick={() => setModePaiement(val)}
                            className="py-2 rounded-lg text-xs font-medium transition"
                            style={{
                              backgroundColor: modePaiement === val ? 'var(--color-accent)' : 'var(--color-surface-2)',
                              color: modePaiement === val ? '#ffffff' : 'var(--color-text-muted)',
                              border: '1px solid var(--color-border)'
                            }}>
                            {icon} {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {modePaiement === 'cash' && (
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                          Montant reçu (FCFA)
                        </label>
                        <input type="number" value={montantRecu}
                          onChange={e => setMontantRecu(e.target.value)}
                          className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                          style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                          placeholder={Number(commandeDetail.total).toString()} />
                        {montantRecu && parseFloat(montantRecu) >= parseFloat(commandeDetail.total) && (
                          <p className="text-green-400 text-xs mt-1">
                            Monnaie : {(parseFloat(montantRecu) - parseFloat(commandeDetail.total)).toLocaleString()} F
                          </p>
                        )}
                      </div>
                    )}
                    <button onClick={() => encaisserCommande(commandeDetail.id)}
                      className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition"
                      style={{ backgroundColor: '#22c55e' }}>
                      Encaisser la commande
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showTicket && ticketData && (
        <ModalTicket
          commande={ticketData.commande}
          vente={ticketData.vente}
          onFermer={() => { setShowTicket(false); setTicketData(null) }}
        />
      )}
    </div>
  )
}