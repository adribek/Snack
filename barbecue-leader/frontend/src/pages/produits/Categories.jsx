import { useState, useEffect } from 'react'
import { produitsService } from '../../services/api'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCategorie, setEditCategorie] = useState(null)
  const [form, setForm] = useState({ nom: '', description: '' })
  const [erreur, setErreur] = useState('')

  useEffect(() => { charger() }, [])

  const charger = async () => {
    try {
      const { data } = await produitsService.categories()
      setCategories(data.results || data)
    } catch {
      setErreur('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const ouvrirModal = (cat = null) => {
    if (cat) {
      setForm({ nom: cat.nom, description: cat.description || '' })
      setEditCategorie(cat)
    } else {
      setForm({ nom: '', description: '' })
      setEditCategorie(null)
    }
    setShowModal(true)
  }

  const fermerModal = () => {
    setShowModal(false)
    setEditCategorie(null)
    setErreur('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editCategorie) {
        await produitsService.modifierCategorie(editCategorie.id, form)
      } else {
        await produitsService.creerCategorie(form)
      }
      fermerModal()
      charger()
    } catch {
      setErreur('Erreur lors de la sauvegarde')
    }
  }

  const supprimer = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    try {
      await produitsService.supprimerCategorie(id)
      charger()
    } catch {
      setErreur('Impossible de supprimer — des produits utilisent cette catégorie')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-orange-500">Chargement...</div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Catégories</h1>
          <p className="text-gray-400 text-sm mt-1">{categories.length} catégorie(s)</p>
        </div>
        <button onClick={() => ouvrirModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2">
          <span>+</span> Nouvelle catégorie
        </button>
      </div>

      {erreur && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-3 text-center text-gray-500 py-12">
            Aucune catégorie — créez-en une !
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-orange-500 text-lg">🏷️</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => ouvrirModal(cat)}
                    className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-500/10 transition">
                    Modifier
                  </button>
                  <button onClick={() => supprimer(cat.id)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition">
                    Supprimer
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-white mb-1">{cat.nom}</h3>
              <p className="text-gray-500 text-sm mb-3">{cat.description || 'Aucune description'}</p>
              <div className="text-xs text-orange-400 font-medium">
                {cat.nombre_produits} produit(s)
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">
                {editCategorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              <button onClick={fermerModal} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {erreur && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {erreur}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nom *</label>
                <input type="text" required value={form.nom}
                  onChange={e => setForm({...form, nom: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Viandes, Boissons..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 resize-none"
                  rows={3} placeholder="Description optionnelle..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={fermerModal}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg transition font-medium">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg transition font-medium">
                  {editCategorie ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}