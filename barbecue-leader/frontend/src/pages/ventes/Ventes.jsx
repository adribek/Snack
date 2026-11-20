import { useState, useEffect } from 'react'
import { ventesService } from '../../services/api'
import { exportRapportVentesPDF } from '../../utils/exportPDF'
import { Download } from 'lucide-react'

const PAIEMENTS = {
  cash: { label: '💵 Cash', bg: 'bg-green-500/10', text: 'text-green-400' },
  mobile: { label: '📱 Mobile', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  credit: { label: '📝 Crédit', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
}

const aujourd_hui = new Date().toISOString().split('T')[0]
const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

export default function Ventes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateDebut, setDateDebut] = useState(debutMois)
  const [dateFin, setDateFin] = useState(aujourd_hui)
  const [filtrePaiement, setFiltrePaiement] = useState('')

  useEffect(() => { charger() }, [dateDebut, dateFin, filtrePaiement])

  const charger = async () => {
    setLoading(true)
    try {
      const params = { date_debut: dateDebut, date_fin: dateFin }
      if (filtrePaiement) params.mode_paiement = filtrePaiement
      const { data } = await ventesService.periode(params)
      setData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const appliquerPreset = (preset) => {
    const today = new Date()
    if (preset === 'jour') {
      const j = today.toISOString().split('T')[0]
      setDateDebut(j); setDateFin(j)
    } else if (preset === 'semaine') {
      const debut = new Date(today)
      debut.setDate(today.getDate() - 7)
      setDateDebut(debut.toISOString().split('T')[0])
      setDateFin(today.toISOString().split('T')[0])
    } else if (preset === 'mois') {
      setDateDebut(debutMois)
      setDateFin(today.toISOString().split('T')[0])
    }
  }

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Chargement des ventes...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ventes</h1>
          <p className="text-gray-500 text-sm mt-1">Historique et analyse des ventes</p>
        </div>
        {data && (
        <button
          onClick={() => exportRapportVentesPDF(data, dateDebut, dateFin)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition text-white"
          style={{ backgroundColor: 'var(--color-accent)' }}>
          <Download size={16} />
          Exporter PDF
        </button>
      )}
      </div>

      {/* Filtres */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => appliquerPreset('jour')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition">
            Aujourd'hui
          </button>
          <button onClick={() => appliquerPreset('semaine')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition">
            7 derniers jours
          </button>
          <button onClick={() => appliquerPreset('mois')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition">
            Ce mois
          </button>
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date début</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date fin</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mode de paiement</label>
            <select value={filtrePaiement} onChange={e => setFiltrePaiement(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
              <option value="">Tous les modes</option>
              <option value="cash">Cash</option>
              <option value="mobile">Mobile Money</option>
              <option value="credit">Crédit</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPIs résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Total des ventes</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
            {(data?.total || 0).toLocaleString()} F
          </p>
        </div>
        <div className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Nombre de ventes</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{data?.nombre || 0}</p>
        </div>
        <div className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Panier moyen</p>
          <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
            {Math.round(data?.panier_moyen || 0).toLocaleString()} F
          </p>
        </div>
        <div className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Bénéfice net</p>
          <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
            {Math.round(data?.benefice || 0).toLocaleString()} F
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {data?.total > 0 ? `${Math.round((data.benefice / data.total) * 100)}% de marge` : ''}
          </p>
        </div>
      </div>

      {/* Top produits + Performance caissiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Top produits vendus</h2>
          {(!data?.top_produits || data.top_produits.length === 0) ? (
            <p className="text-gray-600 text-sm text-center py-8">Aucune donnée sur cette période</p>
          ) : (
            <div className="space-y-3">
              {data.top_produits.map((p, i) => {
                const maxQte = data.top_produits[0].total_quantite
                const pct = (p.total_quantite / maxQte) * 100
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{p.produit__nom}</span>
                      <span className="text-white font-medium">{p.total_quantite}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-orange-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Performance par caissier</h2>
          {(!data?.par_caissier || data.par_caissier.length === 0) ? (
            <p className="text-gray-600 text-sm text-center py-8">Aucune donnée sur cette période</p>
          ) : (
            <div className="space-y-3">
              {data.par_caissier.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {c.caissier__first_name || 'N/A'} {c.caissier__last_name || ''}
                    </p>
                    <p className="text-gray-500 text-xs">{c.nombre} vente(s)</p>
                  </div>
                  <span className="text-orange-400 font-bold text-sm">
                    {Number(c.total).toLocaleString()} F
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Détail des ventes</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/30">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">N° Commande</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Caissier</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Paiement</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Reçu</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Monnaie</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Total</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {(!data?.ventes || data.ventes.length === 0) ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    <span className="text-4xl">💰</span>
                    <p className="text-sm">Aucune vente sur cette période</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.ventes.map(v => {
                const paiement = PAIEMENTS[v.mode_paiement] || { label: v.mode_paiement, bg: 'bg-gray-700', text: 'text-gray-300' }
                return (
                  <tr key={v.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4 text-orange-400 font-semibold text-sm">#{v.commande_numero}</td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{v.caissier_nom || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${paiement.bg} ${paiement.text}`}>
                        {paiement.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300 text-sm">
                      {Number(v.montant_recu).toLocaleString()} F
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <span className={Number(v.monnaie_rendue) > 0 ? 'text-green-400' : 'text-gray-500'}>
                        {Number(v.monnaie_rendue).toLocaleString()} F
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-bold text-sm">
                      {Number(v.montant_total).toLocaleString()} F
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 text-xs">
                      {new Date(v.date_vente).toLocaleDateString('fr-FR')}
                      <br />
                      {new Date(v.date_vente).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {data?.ventes?.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-700 bg-gray-800/20">
                <td colSpan={5} className="px-6 py-4 text-gray-400 text-sm font-medium">
                  Total — {data.nombre} transaction(s)
                </td>
                <td className="px-6 py-4 text-right text-orange-400 font-bold text-lg">
                  {data.total.toLocaleString()} F
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}