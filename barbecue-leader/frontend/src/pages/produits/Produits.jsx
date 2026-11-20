import { useState, useEffect } from 'react'
import { produitsService } from '../../services/api'

export default function Produits() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduit, setEditProduit] = useState(null)
  const [filtreCategorie, setFiltreCategorie] = useState('')
  const [recherche, setRecherche] = useState('')
  const [erreur, setErreur] = useState('')

  const [form, setForm] = useState({
    nom: '', categorie: '', prix_vente: '', prix_achat: '',
    stock_actuel: '', stock_minimum: '5', unite: 'unité', est_actif: true, image: null
  })

  useEffect(() => { chargerDonnees() }, [])

  const chargerDonnees = async () => {
    try {
      const [produitsRes, catsRes] = await Promise.all([
        produitsService.liste(),
        produitsService.categories(),
      ])
      const data = produitsRes.data.results || produitsRes.data
      setProduits(data)
      setCategories(catsRes.data.results || catsRes.data)
    } catch (e) {
      setErreur('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const ouvrirModal = (produit = null) => {
    if (produit) {
      setForm({
        nom: produit.nom,
        categorie: produit.categorie || '',
        prix_vente: produit.prix_vente,
        prix_achat: produit.prix_achat,
        stock_actuel: produit.stock_actuel,
        stock_minimum: produit.stock_minimum,
        unite: produit.unite,
        est_actif: produit.est_actif,
        image: null,
      })
      setEditProduit(produit)
    } else {
      setForm({
        nom: '', categorie: '', prix_vente: '', prix_achat: '',
        stock_actuel: '', stock_minimum: '5', unite: 'unité', est_actif: true, image: null
      })
      setEditProduit(null)
    }
    setShowModal(true)
  }

  const fermerModal = () => {
    setShowModal(false)
    setEditProduit(null)
    setErreur('')
    setFiltreCategorie('')
    setRecherche('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'est_actif') {
          formData.append(key, val ? 'true' : 'false')
        } else if (key === 'image' && val instanceof File) {
          formData.append(key, val)
        } else if (key !== 'image' && val !== null && val !== undefined && val !== '') {
          formData.append(key, val)
        }
      })
      if (editProduit) {
        await produitsService.modifier(editProduit.id, formData)
      } else {
        await produitsService.creer(formData)
      }
      fermerModal()
      await chargerDonnees()
    } catch (e) {
      console.error(e)
      setErreur('Erreur lors de la sauvegarde')
    }
  }

  const toggleActif = async (produit) => {
    try {
      const formData = new FormData()
      formData.append('est_actif', !produit.est_actif ? 'true' : 'false')
      await produitsService.modifier(produit.id, formData)
      chargerDonnees()
    } catch {}
  }

  const supprimer = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      await produitsService.supprimer(id)
      chargerDonnees()
    } catch {}
  }

  const produitsFiltres = produits.filter(p => {
    const matchCat = filtreCategorie ? p.categorie == filtreCategorie : true
    const matchSearch = p.nom.toLowerCase().includes(recherche.toLowerCase())
    return matchCat && matchSearch
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Produits</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {produits.length} produit(s) au catalogue
          </p>
        </div>
        <button onClick={() => ouvrirModal()}
          className="px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2 text-white"
          style={{ backgroundColor: 'var(--color-accent)' }}>
          + Nouveau produit
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Rechercher un produit..."
          value={recherche} onChange={e => setRecherche(e.target.value)}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
        <select value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)}
          className="rounded-lg px-4 py-2.5 text-sm focus:outline-none"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <div className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
              <th className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3"
                style={{ color: 'var(--color-text-muted)' }}>Produit</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3"
                style={{ color: 'var(--color-text-muted)' }}>Catégorie</th>
              <th className="text-right text-xs font-semibold uppercase tracking-wider px-6 py-3"
                style={{ color: 'var(--color-text-muted)' }}>Prix vente</th>
              <th className="text-right text-xs font-semibold uppercase tracking-wider px-6 py-3"
                style={{ color: 'var(--color-text-muted)' }}>Prix achat</th>
              <th className="text-right text-xs font-semibold uppercase tracking-wider px-6 py-3"
                style={{ color: 'var(--color-text-muted)' }}>Stock</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wider px-6 py-3"
                style={{ color: 'var(--color-text-muted)' }}>Statut</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wider px-6 py-3"
                style={{ color: 'var(--color-text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {produitsFiltres.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12"
                  style={{ color: 'var(--color-text-muted)' }}>
                  Aucun produit trouvé
                </td>
              </tr>
            ) : (
              produitsFiltres.map((p, i) => (
                <tr key={p.id} style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--color-surface-2)'
                }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img
                          src={p.image.startsWith('http') ? p.image : `http://127.0.0.1:8000${p.image}`}
                          className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
                          alt={p.nom} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--color-surface-2)' }}>
                          <span className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>
                            {p.nom.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{p.nom}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.unite}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                      {p.categorie_nom || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--color-text)' }}>
                    {Number(p.prix_vente).toLocaleString()} F
                  </td>
                  <td className="px-6 py-4 text-right" style={{ color: 'var(--color-text-muted)' }}>
                    {Number(p.prix_achat).toLocaleString()} F
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-medium ${p.stock_bas ? 'text-red-400' : 'text-green-400'}`}>
                      {p.stock_actuel}
                    </span>
                    {p.stock_bas && <span className="ml-1 text-xs text-red-400">⚠️</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleActif(p)}
                      className="text-xs px-3 py-1 rounded-full font-medium transition"
                      style={{
                        backgroundColor: p.est_actif ? 'rgba(34,197,94,0.1)' : 'var(--color-surface-2)',
                        color: p.est_actif ? '#22c55e' : 'var(--color-text-muted)'
                      }}>
                      {p.est_actif ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => ouvrirModal(p)}
                        className="text-sm px-3 py-1 rounded-lg transition"
                        style={{ color: '#60a5fa' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(96,165,250,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                        Modifier
                      </button>
                      <button onClick={() => supprimer(p.id)}
                        className="text-sm px-3 py-1 rounded-lg transition"
                        style={{ color: '#f87171' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {editProduit ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button onClick={fermerModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {erreur && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {erreur}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Nom du produit *</label>
                  <input type="text" required value={form.nom}
                    onChange={e => setForm({...form, nom: e.target.value})}
                    className="w-full rounded-lg px-4 py-2.5 focus:outline-none text-sm"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="Ex: Poulet braisé" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Catégorie</label>
                  <select value={form.categorie}
                    onChange={e => setForm({...form, categorie: e.target.value})}
                    className="w-full rounded-lg px-4 py-2.5 focus:outline-none text-sm"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                    <option value="">Sans catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Prix de vente (FCFA) *</label>
                  <input type="number" required value={form.prix_vente}
                    onChange={e => setForm({...form, prix_vente: e.target.value})}
                    className="w-full rounded-lg px-4 py-2.5 focus:outline-none text-sm"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="0" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Prix d'achat (FCFA)</label>
                  <input type="number" value={form.prix_achat}
                    onChange={e => setForm({...form, prix_achat: e.target.value})}
                    className="w-full rounded-lg px-4 py-2.5 focus:outline-none text-sm"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="0" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Stock actuel</label>
                  <input type="number" value={form.stock_actuel}
                    onChange={e => setForm({...form, stock_actuel: e.target.value})}
                    className="w-full rounded-lg px-4 py-2.5 focus:outline-none text-sm"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="0" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Stock minimum</label>
                  <input type="number" value={form.stock_minimum}
                    onChange={e => setForm({...form, stock_minimum: e.target.value})}
                    className="w-full rounded-lg px-4 py-2.5 focus:outline-none text-sm"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="5" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Unité</label>
                  <input type="text" value={form.unite}
                    onChange={e => setForm({...form, unite: e.target.value})}
                    className="w-full rounded-lg px-4 py-2.5 focus:outline-none text-sm"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="unité, kg, litre..." />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Image du produit</label>
                  <input type="file" accept="image/*"
                    onChange={e => setForm({...form, image: e.target.files[0]})}
                    className="w-full rounded-lg px-4 py-2.5 text-sm cursor-pointer"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                  {editProduit?.image && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={editProduit.image.startsWith('http') ? editProduit.image : `http://127.0.0.1:8000${editProduit.image}`}
                        className="w-12 h-12 object-contain rounded-lg" alt="aperçu" />
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Image actuelle</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="est_actif" checked={form.est_actif}
                    onChange={e => setForm({...form, est_actif: e.target.checked})}
                    className="w-4 h-4" />
                  <label htmlFor="est_actif" className="text-sm"
                    style={{ color: 'var(--color-text-muted)' }}>
                    Produit actif
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={fermerModal}
                  className="flex-1 py-2.5 rounded-lg transition font-medium text-sm"
                  style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg transition font-medium text-sm text-white"
                  style={{ backgroundColor: 'var(--color-accent)' }}>
                  {editProduit ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}