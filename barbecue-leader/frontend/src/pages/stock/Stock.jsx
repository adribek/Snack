import { useState, useEffect } from 'react'
import { stockService, produitsService } from '../../services/api'

const TYPES = {
  entree: { label: 'Entrée', bg: 'bg-green-500/10', text: 'text-green-400', icone: '📥' },
  sortie: { label: 'Sortie', bg: 'bg-red-500/10', text: 'text-red-400', icone: '📤' },
  ajustement: { label: 'Ajustement', bg: 'bg-blue-500/10', text: 'text-blue-400', icone: '🔧' },
  perte: { label: 'Perte', bg: 'bg-orange-500/10', text: 'text-orange-400', icone: '⚠️' },
}

export default function Stock() {
  const [mouvements, setMouvements] = useState([])
  const [alertes, setAlertes] = useState([])
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ produit: '', type_mouvement: 'entree', quantite: '', motif: '' })
  const [erreur, setErreur] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { charger() }, [])

  const charger = async () => {
    try {
      const [mvRes, alertesRes, produitsRes] = await Promise.all([
        stockService.mouvements(),
        stockService.alertes(),
        produitsService.liste(),
      ])
      setMouvements(mvRes.data.results || mvRes.data)
      setAlertes(alertesRes.data)
      setProduits(produitsRes.data.results || produitsRes.data)
    } catch {
      setErreur('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    try {
      await stockService.ajuster({
        ...form,
        quantite: parseInt(form.quantite),
        produit: parseInt(form.produit),
      })
      setSuccess('Stock mis à jour avec succès !')
      setShowModal(false)
      setForm({ produit: '', type_mouvement: 'entree', quantite: '', motif: '' })
      charger()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setErreur('Erreur lors de l\'ajustement')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Chargement du stock...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion du Stock</h1>
          <p className="text-gray-500 text-sm mt-1">{mouvements.length} mouvement(s) enregistré(s)</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
          <span>+</span> Ajuster le stock
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Alertes stock bas */}
      {alertes.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-400 text-lg">⚠️</span>
            <h2 className="text-red-400 font-semibold">
              {alertes.length} produit(s) en stock bas
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertes.map(p => (
              <div key={p.id} className="bg-gray-900 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{p.nom}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{p.categorie_nom}</p>
                  </div>
                  <span className="text-red-400 font-bold text-sm">{p.stock_actuel}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Stock actuel</span>
                    <span>Min: {p.stock_minimum}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-red-500"
                      style={{ width: `${Math.min(100, (p.stock_actuel / p.stock_minimum) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tableau mouvements */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Historique des mouvements</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/30">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Produit</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Type</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Quantité</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Avant</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Après</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Motif</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Par</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {mouvements.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    <span className="text-4xl">📦</span>
                    <p className="text-sm">Aucun mouvement de stock</p>
                  </div>
                </td>
              </tr>
            ) : (
              mouvements.map(m => {
                const type = TYPES[m.type_mouvement] || TYPES.ajustement
                return (
                  <tr key={m.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4 text-white text-sm font-medium">{m.produit_nom}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${type.bg} ${type.text}`}>
                        {type.icone} {type.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">{m.quantite}</td>
                    <td className="px-6 py-4 text-right text-gray-400 text-sm">{m.stock_avant}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      <span className={m.stock_apres > m.stock_avant ? 'text-green-400' : 'text-red-400'}>
                        {m.stock_apres}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{m.motif || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{m.effectue_par_nom || '—'}</td>
                    <td className="px-6 py-4 text-right text-gray-500 text-xs">
                      {new Date(m.created_at).toLocaleDateString('fr-FR')}
                      <br />
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal ajustement */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Ajuster le stock</h2>
              <button onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {erreur && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {erreur}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Produit *</label>
                <select required value={form.produit}
                  onChange={e => setForm({...form, produit: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500">
                  <option value="">Sélectionner un produit</option>
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} (stock: {p.stock_actuel})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type de mouvement *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['entree', '📥', 'Entrée'], ['ajustement', '🔧', 'Ajustement'], ['perte', '⚠️', 'Perte']].map(([val, icon, label]) => (
                    <button key={val} type="button"
                      onClick={() => setForm({...form, type_mouvement: val})}
                      className={`py-2.5 rounded-xl text-xs font-medium transition ${
                        form.type_mouvement === val
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {form.type_mouvement === 'ajustement' ? 'Nouveau stock' : 'Quantité'} *
                </label>
                <input type="number" required min="1" value={form.quantite}
                  onChange={e => setForm({...form, quantite: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Motif</label>
                <input type="text" value={form.motif}
                  onChange={e => setForm({...form, motif: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Livraison fournisseur, Inventaire..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl transition font-medium">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl transition font-bold">
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}