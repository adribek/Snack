import { useState, useEffect, useRef } from 'react'
import { produitsService, commandesService } from '../../services/api'
import {
  ShoppingCart, Clock, CheckCircle, AlertCircle,
  Plus, Minus, X, Bell, BellOff
} from 'lucide-react'

const STATUTS = {
  en_attente: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  en_cours: { label: 'En cours', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  servie: { label: 'Servie', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  payee: { label: 'Payée', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
}

export default function Serveuse() {
  const [onglet, setOnglet] = useState('commande')
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [commandes, setCommandes] = useState([])
  const [panier, setPanier] = useState([])
  const [filtreCategorie, setFiltreCategorie] = useState('')
  const [recherche, setRecherche] = useState('')
  const [tableNumero, setTableNumero] = useState('')
  const [nomClient, setNomClient] = useState('')
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [erreur, setErreur] = useState('')
  const [notifications, setNotifications] = useState([])
  const [notifVisible, setNotifVisible] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const commandesRef = useRef([])
  const intervalRef = useRef(null)

  useEffect(() => {
    charger()
    // Polling toutes les 10 secondes
    intervalRef.current = setInterval(() => {
      verifierNouvellesCommandes()
    }, 10000)
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (onglet === 'commandes') chargerCommandes()
  }, [onglet])

  const charger = async () => {
    try {
      const [produitsRes, catsRes] = await Promise.all([
        produitsService.liste(),
        produitsService.categories(),
      ])
      setProduits(produitsRes.data.results || produitsRes.data)
      setCategories(catsRes.data.results || catsRes.data)
      await chargerCommandes()
    } catch {
      setErreur('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const chargerCommandes = async () => {
    try {
      const { data } = await commandesService.liste()
      const nouvellesCommandes = data.results || data
      if (commandesRef.current.length > 0) {
        detecterChangements(nouvellesCommandes)
      }
      setCommandes(nouvellesCommandes)
      commandesRef.current = nouvellesCommandes
    } catch {}
  }

  const verifierNouvellesCommandes = async () => {
    try {
      const { data } = await commandesService.liste()
      const nouvellesCommandes = data.results || data
      if (commandesRef.current.length > 0) {
        detecterChangements(nouvellesCommandes)
      }
      setCommandes(nouvellesCommandes)
      commandesRef.current = nouvellesCommandes
    } catch {}
  }

  const detecterChangements = (nouvellesCommandes) => {
    const anciennes = commandesRef.current
    const nouvelles = []

    nouvellesCommandes.forEach(newCmd => {
      const ancienne = anciennes.find(c => c.id === newCmd.id)
      if (ancienne && ancienne.statut !== newCmd.statut) {
        if (newCmd.statut === 'en_cours') {
          nouvelles.push({
            id: Date.now() + Math.random(),
            message: `Commande #${newCmd.numero} est en cours de préparation !`,
            type: 'info',
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            commande: newCmd.numero,
            table: newCmd.table_numero,
          })
        }
        if (newCmd.statut === 'servie') {
          nouvelles.push({
            id: Date.now() + Math.random(),
            message: `Commande #${newCmd.numero} a été servie`,
            type: 'success',
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            commande: newCmd.numero,
            table: newCmd.table_numero,
          })
        }
      }
      // Nouvelle commande détectée
      if (!ancienne) {
        nouvelles.push({
          id: Date.now() + Math.random(),
          message: `Nouvelle commande #${newCmd.numero} reçue`,
          type: 'new',
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          commande: newCmd.numero,
          table: newCmd.table_numero,
        })
      }
    })

    if (nouvelles.length > 0) {
      setNotifications(prev => [...nouvelles, ...prev].slice(0, 10))
      setNotifCount(prev => prev + nouvelles.length)
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.value = 0.3
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
      } catch {}
    }
  }

  const ajouterAuPanier = (produit) => {
    setPanier(prev => {
      const existe = prev.find(p => p.id === produit.id)
      if (existe) return prev.map(p => p.id === produit.id ? { ...p, quantite: p.quantite + 1 } : p)
      return [...prev, { ...produit, quantite: 1 }]
    })
  }

  const modifierQuantite = (id, delta) => {
    setPanier(prev => prev.map(p => p.id === id
      ? { ...p, quantite: Math.max(1, p.quantite + delta) }
      : p
    ).filter(p => p.quantite > 0))
  }

  const retirerDuPanier = (id) => setPanier(prev => prev.filter(p => p.id !== id))
  const viderPanier = () => { setPanier([]); setTableNumero(''); setNomClient('') }

  const total = panier.reduce((sum, p) => sum + p.quantite * parseFloat(p.prix_vente), 0)

  const envoyerCommande = async () => {
    if (panier.length === 0) return
    if (!tableNumero) { setErreur('Veuillez indiquer un numéro de table'); return }
    setErreur('')
    try {
      await commandesService.creer({
        nom_client: nomClient,
        table_numero: tableNumero,
        remise: 0,
        lignes: panier.map(p => ({
          produit: p.id,
          quantite: p.quantite,
          prix_unitaire: p.prix_vente,
        }))
      })
      setSuccess(`Commande envoyée — Table ${tableNumero} !`)
      viderPanier()
      chargerCommandes()
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setErreur('Erreur lors de l\'envoi de la commande')
    }
  }

  const changerStatut = async (id, statut) => {
    try {
      await commandesService.changerStatut(id, statut)
      setSuccess('Statut mis à jour !')
      chargerCommandes()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setErreur('Erreur lors du changement de statut')
    }
  }

  const marquerNotifsLues = () => {
    setNotifCount(0)
    setNotifVisible(!notifVisible)
  }

  const produitsFiltres = produits.filter(p => {
    const matchCat = filtreCategorie ? p.categorie == filtreCategorie : true
    const matchSearch = p.nom.toLowerCase().includes(recherche.toLowerCase())
    return matchCat && matchSearch && p.est_actif
  })

  const commandesActives = commandes.filter(c => c.statut !== 'payee' && c.statut !== 'annulee')
  const commandesPretesAServir = commandes.filter(c => c.statut === 'en_cours')

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Espace Serveuse</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Prise de commandes en salle
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Alerte commandes prêtes */}
          {commandesPretesAServir.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl animate-pulse"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <AlertCircle size={16} color="#3b82f6" />
              <span className="text-xs font-bold" style={{ color: '#3b82f6' }}>
                {commandesPretesAServir.length} commande(s) en cours !
              </span>
            </div>
          )}

          {/* Cloche notifications */}
          <div className="relative">
            <button onClick={marquerNotifsLues}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl transition"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {notifCount > 0
                ? <Bell size={18} style={{ color: 'var(--color-accent)' }} />
                : <BellOff size={18} style={{ color: 'var(--color-text-muted)' }} />
              }
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                  style={{ backgroundColor: 'var(--color-accent)' }}>
                  {notifCount}
                </span>
              )}
            </button>

            {/* Panel notifications */}
            {notifVisible && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Notifications</p>
                  <button onClick={() => { setNotifications([]); setNotifVisible(false) }}
                    className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Tout effacer
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <BellOff size={24} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="px-4 py-3 flex items-start gap-3"
                        style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                          <Bell size={14} color="#3b82f6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                            {notif.message}
                          </p>
                          {notif.table && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              Table {notif.table}
                            </p>
                          )}
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            {notif.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {erreur && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          {erreur}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 p-1 rounded-xl w-fit"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {[
          { key: 'commande', label: 'Nouvelle commande', icon: ShoppingCart },
          { key: 'commandes', label: 'Mes commandes', icon: Clock },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setOnglet(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{
              backgroundColor: onglet === key ? 'var(--color-accent)' : 'transparent',
              color: onglet === key ? '#ffffff' : 'var(--color-text-muted)',
            }}>
            <Icon size={16} />
            {label}
            {key === 'commandes' && commandesActives.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: onglet === key ? 'rgba(255,255,255,0.3)' : 'var(--color-surface-2)', color: onglet === key ? '#fff' : 'var(--color-text-muted)' }}>
                {commandesActives.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Onglet Nouvelle commande ── */}
      {onglet === 'commande' && (
        <div className="flex gap-4" style={{ height: 'calc(100vh - 250px)' }}>
          {/* Produits */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-3 space-y-2">
              <input type="text" placeholder="Rechercher un produit..."
                value={recherche} onChange={e => setRecherche(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setFiltreCategorie('')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                  style={{
                    backgroundColor: !filtreCategorie ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: !filtreCategorie ? '#fff' : 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)'
                  }}>
                  Tous
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setFiltreCategorie(cat.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    style={{
                      backgroundColor: filtreCategorie == cat.id ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: filtreCategorie == cat.id ? '#fff' : 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)'
                    }}>
                    {cat.nom}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pb-4">
              {produitsFiltres.map(p => (
                <button key={p.id} onClick={() => ajouterAuPanier(p)}
                  className="rounded-xl p-3 text-left transition"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                  <div className="w-full h-20 rounded-lg flex items-center justify-center mb-2 overflow-hidden"
                    style={{ backgroundColor: 'var(--color-surface-2)' }}>
                    {p.image ? (
                      <img src={p.image.startsWith('http') ? p.image : `http://127.0.0.1:8000${p.image}`}
                        className="w-full h-full object-contain rounded-lg" alt={p.nom} />
                    ) : (
                      <span className="text-lg font-bold" style={{ color: 'var(--color-text-muted)' }}>
                        {p.nom.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold mb-1 truncate" style={{ color: 'var(--color-text)' }}>{p.nom}</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                    {Number(p.prix_vente).toLocaleString()} F
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Panier */}
          <div className="w-72 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold" style={{ color: 'var(--color-text)' }}>Commande</h2>
                {panier.length > 0 && (
                  <button onClick={viderPanier} className="text-xs text-red-400">Vider</button>
                )}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Table *"
                  value={tableNumero} onChange={e => setTableNumero(e.target.value)}
                  className="w-20 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                <input type="text" placeholder="Client"
                  value={nomClient} onChange={e => setNomClient(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {panier.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={32} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Sélectionnez des produits
                  </p>
                </div>
              ) : (
                panier.map(p => (
                  <div key={p.id} className="rounded-lg p-3"
                    style={{ backgroundColor: 'var(--color-surface-2)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-medium flex-1 pr-2" style={{ color: 'var(--color-text)' }}>{p.nom}</p>
                      <button onClick={() => retirerDuPanier(p.id)}>
                        <X size={12} color="#f87171" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => modifierQuantite(p.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ backgroundColor: 'var(--color-border)' }}>
                          <Minus size={10} style={{ color: 'var(--color-text)' }} />
                        </button>
                        <span className="text-xs w-4 text-center" style={{ color: 'var(--color-text)' }}>{p.quantite}</span>
                        <button onClick={() => modifierQuantite(p.id, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ backgroundColor: 'var(--color-border)' }}>
                          <Plus size={10} style={{ color: 'var(--color-text)' }} />
                        </button>
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                        {(p.quantite * parseFloat(p.prix_vente)).toLocaleString()} F
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Total</span>
                <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                  {total.toLocaleString()} F
                </span>
              </div>
              <button onClick={envoyerCommande}
                disabled={panier.length === 0 || !tableNumero}
                className="w-full font-bold py-3 rounded-lg transition text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: panier.length === 0 || !tableNumero ? 'var(--color-border)' : 'var(--color-accent)' }}>
                <ShoppingCart size={16} />
                Envoyer la commande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Onglet Mes commandes ── */}
      {onglet === 'commandes' && (
        <div className="space-y-3">
          {/* Bannière commandes en cours */}
          {commandesPretesAServir.length > 0 && (
            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '2px solid rgba(59,130,246,0.4)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}>
                <Bell size={20} color="#3b82f6" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#3b82f6' }}>
                  {commandesPretesAServir.length} commande(s) en cours de préparation !
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#3b82f6', opacity: 0.8 }}>
                  {commandesPretesAServir.map(c => `#${c.numero} (Table ${c.table_numero || '?'})`).join(' · ')}
                </p>
              </div>
            </div>
          )}

          {commandesActives.length === 0 ? (
            <div className="text-center py-16 rounded-2xl"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <CheckCircle size={48} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>Aucune commande active</p>
            </div>
          ) : (
            commandesActives.map(cmd => {
              const statut = STATUTS[cmd.statut] || STATUTS.en_attente
              const estEnCours = cmd.statut === 'en_cours'
              return (
                <div key={cmd.id} className="rounded-2xl p-5 transition"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: `2px solid ${estEnCours ? '#3b82f6' : statut.color + '40'}`,
                    boxShadow: estEnCours ? '0 0 15px rgba(59,130,246,0.2)' : 'none'
                  }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold" style={{ color: 'var(--color-accent)' }}>
                          #{cmd.numero}
                        </span>
                        {cmd.table_numero && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                            Table {cmd.table_numero}
                          </span>
                        )}
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ backgroundColor: statut.bg, color: statut.color }}>
                          {estEnCours && '🔔 '}{statut.label}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(cmd.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {cmd.nom_client && ` — ${cmd.nom_client}`}
                      </p>
                    </div>
                    <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                      {Number(cmd.total).toLocaleString()} F
                    </span>
                  </div>

                  {/* Articles */}
                  <div className="space-y-1 mb-4">
                    {(cmd.lignes || []).map(ligne => (
                      <div key={ligne.id} className="flex justify-between text-sm"
                        style={{ color: 'var(--color-text-muted)' }}>
                        <span>{ligne.quantite}× {ligne.produit_nom}</span>
                        <span>{Number(ligne.sous_total).toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {cmd.statut === 'en_attente' && (
                      <button onClick={() => changerStatut(cmd.id, 'en_cours')}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition"
                        style={{ backgroundColor: '#3b82f6' }}>
                        Marquer en cours
                      </button>
                    )}
                    {cmd.statut === 'en_cours' && (
                      <button onClick={() => changerStatut(cmd.id, 'servie')}
                        className="text-xs px-4 py-2 rounded-lg font-bold text-white transition animate-pulse"
                        style={{ backgroundColor: '#22c55e' }}>
                        ✓ Marquer comme servie
                      </button>
                    )}
                    {cmd.statut === 'servie' && (
                      <span className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                        ✓ Servie — en attente de paiement
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}