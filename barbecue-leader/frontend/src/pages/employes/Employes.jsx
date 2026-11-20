import { useState, useEffect } from 'react'
import { employesService } from '../../services/api'
import { User, Phone, Calendar, DollarSign, Hash, Camera } from 'lucide-react'

const ROLES = {
  admin: { label: 'Administrateur', bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  gerant: { label: 'Gérant', bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
  caissier: { label: 'Caissier', bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
  serveuse: { label: 'Serveuse', bg: 'rgba(168,85,247,0.1)', text: '#a855f7' },
  securite: { label: 'Sécurité', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  manager: { label: 'Manager', bg: 'rgba(20,184,166,0.1)', text: '#14b8a6' },
  cuisinier: { label: 'Cuisinier', bg: 'rgba(236,72,153,0.1)', text: '#ec4899' },
  dj: { label: 'DJ', bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
  chef_salle: { label: 'Chef de salle', bg: 'rgba(234,179,8,0.1)', text: '#eab308' },
  directeur: { label: 'Directeur', bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
}

const getRoleBadge = (role) => ROLES[role] || { label: role, bg: 'rgba(107,114,128,0.1)', text: '#6b7280' }

export default function Employes() {
  const [employes, setEmployes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [employeSelectionne, setEmployeSelectionne] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [formEdit, setFormEdit] = useState({})
  const [photoEditPreview, setPhotoEditPreview] = useState(null)
  const [erreur, setErreur] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', role: 'caissier', telephone: '',
    numero_employe: '', date_embauche: '', salaire: '', adresse: '', photo: null
  })
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => { charger() }, [])

  const charger = async () => {
    try {
      const { data } = await employesService.liste()
      setEmployes(data.results || data)
    } catch {
      setErreur('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setForm({...form, photo: file})
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handlePhotoEditChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormEdit({...formEdit, photo: file})
      setPhotoEditPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'photo' && val instanceof File) {
          formData.append(key, val)
        } else if (key !== 'photo' && val !== null && val !== undefined && val !== '') {
          formData.append(key, val)
        }
      })
      await employesService.creer(formData)
      setSuccess('Employé créé avec succès !')
      setShowModal(false)
      setPhotoPreview(null)
      setForm({
        username: '', password: '', first_name: '', last_name: '',
        email: '', role: 'caissier', telephone: '',
        numero_employe: '', date_embauche: '', salaire: '', adresse: '', photo: null
      })
      charger()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Erreur création:', err.response?.data)
      setErreur(JSON.stringify(err.response?.data) || 'Erreur lors de la création')
    }
  }

  const ouvrirDetail = (emp) => {
    setEmployeSelectionne(emp)
    setFormEdit({
      first_name: emp.utilisateur?.first_name || '',
      last_name: emp.utilisateur?.last_name || '',
      telephone: emp.utilisateur?.telephone || '',
      role: emp.utilisateur?.role || 'caissier',
      salaire: emp.salaire || '',
      adresse: emp.adresse || '',
      date_embauche: emp.date_embauche || '',
      photo: null,
    })
    setPhotoEditPreview(
      emp.photo ? (emp.photo.startsWith('http') ? emp.photo : `http://127.0.0.1:8000${emp.photo}`) : null
    )
    setShowDetail(true)
  }

  const handleModifier = async (e) => {
    e.preventDefault()
    setErreur('')
    try {
      const formData = new FormData()
      Object.entries(formEdit).forEach(([key, val]) => {
        if (key === 'photo' && val instanceof File) {
          formData.append(key, val)
        } else if (key !== 'photo' && val !== null && val !== undefined && val !== '') {
          formData.append(key, val)
        }
      })
      await employesService.modifier(employeSelectionne.id, formData)
      setSuccess('Employé modifié avec succès !')
      setShowDetail(false)
      charger()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Erreur modification:', err.response?.data)
      setErreur(JSON.stringify(err.response?.data) || 'Erreur lors de la modification')
    }
  }

  const toggleActif = async (emp) => {
    try {
      const userId = emp.utilisateur?.id
      const nouvelEtat = !emp.utilisateur?.est_actif
      await employesService.toggleActif(userId, nouvelEtat)
      setSuccess(nouvelEtat ? 'Employé activé !' : 'Employé désactivé !')
      charger()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setErreur('Erreur lors du changement de statut')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Employés</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {employes.length} employé(s) enregistré(s)
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 text-white"
          style={{ backgroundColor: 'var(--color-accent)' }}>
          + Nouvel employé
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
          {success}
        </div>
      )}
      {erreur && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employes.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <User size={48} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucun employé enregistré</p>
          </div>
        ) : (
          employes.map(emp => {
            const role = getRoleBadge(emp.utilisateur?.role)
            const photoUrl = emp.photo
              ? (emp.photo.startsWith('http') ? emp.photo : `http://127.0.0.1:8000${emp.photo}`)
              : null
            return (
              <div key={emp.id} className="rounded-2xl p-5 transition"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-surface-2)' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={emp.utilisateur?.first_name}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={28} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                      {emp.utilisateur?.first_name} {emp.utilisateur?.last_name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      @{emp.utilisateur?.username}
                    </p>
                    <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: role.bg, color: role.text }}>
                      {role.label}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Hash size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {emp.numero_employe}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(emp.date_embauche).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {emp.utilisateur?.telephone && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={14} style={{ color: 'var(--color-text-muted)' }} />
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {emp.utilisateur.telephone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <DollarSign size={14} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                      {Number(emp.salaire).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 flex items-center justify-between"
                  style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: emp.utilisateur?.est_actif ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: emp.utilisateur?.est_actif ? '#22c55e' : '#ef4444'
                    }}>
                    {emp.utilisateur?.est_actif ? '● Actif' : '● Inactif'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => ouvrirDetail(emp)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
                      style={{ color: '#60a5fa' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(96,165,250,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                      Modifier
                    </button>
                    <button onClick={() => toggleActif(emp)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
                      style={{ color: emp.utilisateur?.est_actif ? '#f87171' : '#22c55e' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = emp.utilisateur?.est_actif ? 'rgba(248,113,113,0.1)' : 'rgba(34,197,94,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                      {emp.utilisateur?.est_actif ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 sticky top-0"
              style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Nouvel employé</h2>
              <button onClick={() => { setShowModal(false); setPhotoPreview(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {erreur && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {erreur}
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-surface-2)', border: '2px dashed var(--color-border)' }}>
                  {photoPreview ? (
                    <img src={photoPreview} className="w-full h-full object-cover" alt="preview" />
                  ) : (
                    <Camera size={32} style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </div>
                <label className="cursor-pointer text-sm font-medium px-4 py-2 rounded-lg transition"
                  style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                </label>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}>Compte utilisateur</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Prénom *', key: 'first_name', placeholder: 'Jean', type: 'text', required: true },
                  { label: 'Nom *', key: 'last_name', placeholder: 'Dupont', type: 'text', required: true },
                  { label: 'Username *', key: 'username', placeholder: 'jean.dupont', type: 'text', required: true },
                  { label: 'Mot de passe *', key: 'password', placeholder: '••••••', type: 'password', required: true },
                  { label: 'Téléphone', key: 'telephone', placeholder: '6XXXXXXXX', type: 'text', required: false },
                  { label: 'Email', key: 'email', placeholder: 'jean@example.com', type: 'email', required: false },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text-muted)' }}>{field.label}</label>
                    <input type={field.type} required={field.required}
                      value={form[field.key]}
                      onChange={e => setForm({...form, [field.key]: e.target.value})}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Rôle *</label>
                  <input type="text" list="roles-list" required
                    value={form.role}
                    onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="Ex: caissier, serveuse..." />
                  <datalist id="roles-list">
                    <option value="admin" />
                    <option value="gerant" />
                    <option value="caissier" />
                    <option value="serveuse" />
                    <option value="securite" />
                    <option value="manager" />
                    <option value="cuisinier" />
                    <option value="dj" />
                    <option value="chef_salle" />
                    <option value="directeur" />
                  </datalist>
                </div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider pt-2"
                style={{ color: 'var(--color-text-muted)' }}>Informations employé</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'N° Employé *', key: 'numero_employe', placeholder: 'EMP-001', type: 'text', required: true },
                  { label: "Date d'embauche *", key: 'date_embauche', placeholder: '', type: 'date', required: true },
                  { label: 'Salaire (FCFA)', key: 'salaire', placeholder: '0', type: 'number', required: false },
                  { label: 'Adresse', key: 'adresse', placeholder: 'Douala, Cameroun', type: 'text', required: false },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text-muted)' }}>{field.label}</label>
                    <input type={field.type} required={field.required}
                      value={form[field.key]}
                      onChange={e => setForm({...form, [field.key]: e.target.value})}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button"
                  onClick={() => { setShowModal(false); setPhotoPreview(null) }}
                  className="flex-1 py-2.5 rounded-xl transition font-medium text-sm"
                  style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl transition font-bold text-sm text-white"
                  style={{ backgroundColor: 'var(--color-accent)' }}>
                  Créer l'employé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal modification */}
      {showDetail && employeSelectionne && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 sticky top-0"
              style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                  Modifier l'employé
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {employeSelectionne.utilisateur?.first_name} {employeSelectionne.utilisateur?.last_name}
                </p>
              </div>
              <button onClick={() => setShowDetail(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                ✕
              </button>
            </div>

            <form onSubmit={handleModifier} className="p-6 space-y-5">
              {erreur && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {erreur}
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-surface-2)', border: '2px dashed var(--color-border)' }}>
                  {photoEditPreview ? (
                    <img src={photoEditPreview} className="w-full h-full object-cover" alt="preview" />
                  ) : (
                    <Camera size={32} style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </div>
                <label className="cursor-pointer text-sm font-medium px-4 py-2 rounded-lg transition"
                  style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoEditChange} />
                  Changer la photo
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Prénom', key: 'first_name', type: 'text' },
                  { label: 'Nom', key: 'last_name', type: 'text' },
                  { label: 'Téléphone', key: 'telephone', type: 'text' },
                  { label: 'Salaire (FCFA)', key: 'salaire', type: 'number' },
                  { label: "Date d'embauche", key: 'date_embauche', type: 'date' },
                  { label: 'Adresse', key: 'adresse', type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text-muted)' }}>{field.label}</label>
                    <input type={field.type} value={formEdit[field.key] || ''}
                      onChange={e => setFormEdit({...formEdit, [field.key]: e.target.value})}
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-muted)' }}>Rôle</label>
                  <input type="text" list="roles-edit-list"
                    value={formEdit.role || ''}
                    onChange={e => setFormEdit({...formEdit, role: e.target.value})}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    placeholder="Ex: caissier, serveuse..." />
                  <datalist id="roles-edit-list">
                    <option value="admin" />
                    <option value="gerant" />
                    <option value="caissier" />
                    <option value="serveuse" />
                    <option value="securite" />
                    <option value="manager" />
                    <option value="cuisinier" />
                    <option value="dj" />
                    <option value="chef_salle" />
                    <option value="directeur" />
                  </datalist>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDetail(false)}
                  className="flex-1 py-2.5 rounded-xl transition font-medium text-sm"
                  style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl transition font-bold text-sm text-white"
                  style={{ backgroundColor: 'var(--color-accent)' }}>
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}