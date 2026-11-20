import { useState, useEffect } from 'react'
import { produitsService, commandesService } from '../../services/api'
import { imprimerTicket } from '../../utils/ticket'
import ModalTicket from '../../components/ModalTicket'

export default function Caisse() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [panier, setPanier] = useState([])
  const [filtreCategorie, setFiltreCategorie] = useState('')
  const [recherche, setRecherche] = useState('')
  const [nomClient, setNomClient] = useState('')
  const [tableNumero, setTableNumero] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEncaisser, setShowEncaisser] = useState(false)
  const [modePaiement, setModePaiement] = useState('cash')
  const [montantRecu, setMontantRecu] = useState('')
  const [commandeEnCours, setCommandeEnCours] = useState(null)
  const [success, setSuccess] = useState('')
  const [erreur, setErreur] = useState('')
  const [showTicket, setShowTicket] = useState(false)
  const [ticketData, setTicketData] = useState(null)

  useEffect(() => { charger() }, [])

  const charger = async () => {
    try {
      const [produitsRes, catsRes] = await Promise.all([
        produitsService.liste(),
        produitsService.categories(),
      ])
      setProduits(produitsRes.data.results || produitsRes.data)
      setCategories(catsRes.data.results || catsRes.data)
    } catch {
      setErreur('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const ajouterAuPanier = (produit) => {
    setPanier(prev => {
      const existe = prev.find(p => p.id === produit.id)
      if (existe) {
        return prev.map(p => p.id === produit.id
          ? { ...p, quantite: p.quantite + 1 }
          : p
        )
      }
      return [...prev, { ...produit, quantite: 1 }]
    })
  }

  const modifierQuantite = (id, delta) => {
    setPanier(prev =>
      prev.map(p => p.id === id
        ? { ...p, quantite: Math.max(1, p.quantite + delta) }
        : p
      ).filter(p => p.quantite > 0)
    )
  }

  const retirerDuPanier = (id) => {
    setPanier(prev => prev.filter(p => p.id !== id))
  }

  const viderPanier = () => {
    setPanier([])
    setNomClient('')
    setTableNumero('')
    setCommandeEnCours(null)
  }

  const total = panier.reduce((sum, p) => sum + p.quantite * parseFloat(p.prix_vente), 0)
  const monnaie = montantRecu ? parseFloat(montantRecu) - total : 0

  const validerCommande = async () => {
    if (panier.length === 0) return
    setErreur('')
    try {
      const data = {
        nom_client: nomClient,
        table_numero: tableNumero,
        remise: 0,
        lignes: panier.map(p => ({
          produit: p.id,
          quantite: p.quantite,
          prix_unitaire: p.prix_vente,
        }))
      }
      const { data: commande } = await commandesService.creer(data)
      setCommandeEnCours(commande)
      setShowEncaisser(true)
    } catch {
      setErreur('Erreur lors de la création de la commande')
    }
  }

  const encaisser = async () => {
    if (!commandeEnCours) return
    try {
      await commandesService.encaisser(commandeEnCours.id, {
        mode_paiement: modePaiement,
        montant_recu: parseFloat(montantRecu) || total,
      })

      setTicketData({
        commande: { ...commandeEnCours, mode_paiement: modePaiement },
        vente: {
          montant_total: total,
          montant_recu: parseFloat(montantRecu) || total,
          monnaie_rendue: montantRecu ? parseFloat(montantRecu) - total : 0,
        }
      })

      setSuccess(`Commande #${commandeEnCours.numero} encaissée !`)
      setShowEncaisser(false)
      viderPanier()
      setMontantRecu('')
      setShowTicket(true)
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setErreur("Erreur lors de l'encaissement")
    }
  }

  const produitsFiltres = produits.filter(p => {
    const matchCat = filtreCategorie ? p.categorie == filtreCategorie : true
    const matchSearch = p.nom.toLowerCase().includes(recherche.toLowerCase())
    return matchCat && matchSearch && p.est_actif
  })

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
    </div>
  )

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>

      {/* Panneau gauche — Produits */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Caisse (POS)</h1>

          {/* Recherche */}
          <input type="text" placeholder="Rechercher un produit..."
            value={recherche} onChange={e => setRecherche(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none mb-2"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />

          {/* Filtres catégories */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFiltreCategorie('')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition text-white"
              style={{ backgroundColor: !filtreCategorie ? 'var(--color-accent)' : 'var(--color-surface)' }}>
              Tous
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setFiltreCategorie(cat.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                style={{
                  backgroundColor: filtreCategorie == cat.id ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: filtreCategorie == cat.id ? '#ffffff' : 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)'
                }}>
                {cat.nom}
              </button>
            ))}
          </div>
        </div>

        {/* Grille produits */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pb-4">
          {produitsFiltres.map(p => (
            <button key={p.id} onClick={() => ajouterAuPanier(p)}
              className="rounded-xl p-4 text-left transition group"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>

              {/* Image ou icône */}
              <div className="w-full h-24 rounded-lg flex items-center justify-center mb-3 overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface-2)' }}>
                              {p.image ? (
                <img src={p.image?.startsWith('http') ? p.image : `http://127.0.0.1:8000/media/${p.image}`}
                  className="w-full h-full object-contain rounded-lg" alt={p.nom} />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    {p.nom.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Aucune image</span>
                </div>
              )}
              </div>

              <p className="text-sm font-medium mb-1 truncate" style={{ color: 'var(--color-text)' }}>{p.nom}</p>
              <p className="font-bold text-sm" style={{ color: 'var(--color-accent)' }}>
                {Number(p.prix_vente).toLocaleString()} F
              </p>
              <p className={`text-xs mt-1 ${p.stock_bas ? 'text-red-400' : ''}`}
                style={!p.stock_bas ? { color: 'var(--color-text-muted)' } : {}}>
                Stock: {p.stock_actuel}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Panneau droit — Panier */}
      <div className="w-80 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

        {/* Header panier */}
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: 'var(--color-text)' }}>Commande</h2>
            {panier.length > 0 && (
              <button onClick={viderPanier} className="text-xs text-red-400 hover:text-red-300 transition">
                Vider
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Client (optionnel)"
              value={nomClient} onChange={e => setNomClient(e.target.value)}
              className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
              style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
            <input type="text" placeholder="Table"
              value={tableNumero} onChange={e => setTableNumero(e.target.value)}
              className="w-16 rounded-lg px-3 py-2 text-xs focus:outline-none"
              style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
          </div>
        </div>

        {/* Lignes panier */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {panier.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🛒</div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Cliquez sur un produit pour l'ajouter
              </p>
            </div>
          ) : (
            panier.map(p => (
              <div key={p.id} className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-surface-2)' }}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium flex-1 pr-2" style={{ color: 'var(--color-text)' }}>{p.nom}</p>
                  <button onClick={() => retirerDuPanier(p.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => modifierQuantite(p.id, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs transition"
                      style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      −
                    </button>
                    <span className="text-sm w-6 text-center" style={{ color: 'var(--color-text)' }}>{p.quantite}</span>
                    <button onClick={() => modifierQuantite(p.id, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-xs transition"
                      style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      +
                    </button>
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--color-accent)' }}>
                    {(p.quantite * parseFloat(p.prix_vente)).toLocaleString()} F
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer panier */}
        <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          {erreur && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg mb-3 text-xs">
              {erreur}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2 rounded-lg mb-3 text-xs">
              {success}
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium" style={{ color: 'var(--color-text-muted)' }}>Total</span>
            <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {total.toLocaleString()} F
            </span>
          </div>
          <button onClick={validerCommande} disabled={panier.length === 0}
            className="w-full font-bold py-3 rounded-lg transition text-white"
            style={{ backgroundColor: panier.length === 0 ? 'var(--color-border)' : 'var(--color-accent)' }}>
            Encaisser
          </button>
        </div>
      </div>

      {/* Modal encaissement */}
      {showEncaisser && commandeEnCours && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-sm"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Encaissement</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Commande #{commandeEnCours.numero}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Total */}
              <div className="rounded-xl p-4 text-center"
                style={{ backgroundColor: 'var(--color-surface-2)' }}>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Montant à payer</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {total.toLocaleString()} F
                </p>
              </div>

              {/* Mode paiement */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Mode de paiement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[['cash', '💵', 'Cash'], ['mobile', '📱', 'Mobile'], ['credit', '📝', 'Crédit']].map(([val, icon, label]) => (
                    <button key={val} onClick={() => setModePaiement(val)}
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

              {/* Montant reçu */}
              {modePaiement === 'cash' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Montant reçu (FCFA)
                  </label>
                  <input type="number" value={montantRecu}
                    onChange={e => setMontantRecu(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 focus:outline-none text-sm"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    placeholder={total.toString()} />
                  {montantRecu && parseFloat(montantRecu) >= total && (
                    <p className="text-green-400 text-sm mt-2">
                      Monnaie à rendre : <strong>{monnaie.toLocaleString()} F</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3">
                <button onClick={() => setShowEncaisser(false)}
                  className="flex-1 py-2.5 rounded-lg transition font-medium text-sm"
                  style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                  Annuler
                </button>
                <button onClick={encaisser}
                  className="flex-1 py-2.5 rounded-lg transition font-bold text-sm text-white"
                  style={{ backgroundColor: '#22c55e' }}>
                  Confirmer
                </button>
              </div>
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