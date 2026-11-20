import { useState, useEffect } from 'react'
import { authService } from '../../services/api'
import { ShieldCheck, ShieldOff, User, Key } from 'lucide-react'


const ROLES = {
  admin: { label: 'Administrateur', bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  gerant: { label: 'Gérant', bg: 'rgba(59,130,246,0.1)', text: '#3b82f6' },
  caissier: { label: 'Caissier', bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
  serveuse: { label: 'Serveuse', bg: 'rgba(168,85,247,0.1)', text: '#a855f7' },
}

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [erreur, setErreur] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', role: '', telephone: '', est_actif: true
  })

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setLoading(true)
    try {
        const { data } = await authService.utilisateurs()
        setUtilisateurs(data.results || data)
    } catch {
        setErreur('Erreur de chargement')
    } finally {
        setLoading(false)
    }
  }

  const ouvrirModal = (user = null) => {
    if (user) {
      setForm({
        username: user.username,
        password: '',
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email || '',
        role: user.role,
        telephone: user.telephone || '',
        est_actif: user.est_actif,
      })
      setEditUser(user)
    } else {
      setForm({
        username: '', password: '', first_name: '', last_name: '',
        email: '', role: 'caissier', telephone: '', est_actif: true
      })
      setEditUser(null)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    try {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        if (editUser) {
        await authService.modifierUtilisateur(editUser.id, payload)
        setSuccess('Utilisateur modifié avec succès !')
        } else {
        await authService.creerUtilisateur(payload)
        setSuccess('Utilisateur créé avec succès !')
        }
        setShowModal(false)
        setEditUser(null)
        await charger()
        setTimeout(() => setSuccess(''), 3000)
    } catch {
        setErreur('Erreur — vérifiez les champs')
    }
  }

  const toggleActif = async (user) => {
    try {
        await authService.modifierUtilisateur(user.id, { est_actif: !user.est_actif })
        setSuccess(user.est_actif ? 'Compte désactivé' : 'Compte activé')
        await charger()
        setTimeout(() => setSuccess(''), 3000)
    } catch {
        setErreur('Erreur lors du changement de statut')
    }
 }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Gestion des utilisateurs
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {utilisateurs.length} compte(s) enregistré(s)
          </p>
        </div>
        <button onClick={() => ouvrirModal()}
          className="px-4 py-2.5 rounded-xl font-medium transition text-white flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-accent)' }}>
          + Nouvel utilisateur
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

      {/* Tableau */}
      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
              {['Utilisateur', 'Rôle', 'Téléphone', 'Statut', 'Actions'].map(h => (
                <th key={h} className={`text-xs font-semibold uppercase tracking-wider px-6 py-3 ${h === 'Actions' || h === 'Statut' ? 'text-center' : 'text-left'}`}
                  style={{ color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {utilisateurs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              utilisateurs.map((u, i) => {
                const role = ROLES[u.role] || ROLES.caissier
                return (
                  <tr key={u.id}
                    style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--color-surface-2)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'transparent' : 'var(--color-surface-2)'}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: role.bg }}>
                          <User size={16} style={{ color: role.text }} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                            {u.first_name} {u.last_name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            @{u.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: role.bg, color: role.text }}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {u.telephone || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: u.est_actif ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: u.est_actif ? '#22c55e' : '#ef4444'
                        }}>
                        {u.est_actif ? '● Actif' : '● Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => ouvrirModal(u)}
                          className="text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                          style={{ color: '#60a5fa' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(96,165,250,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                          <Key size={12} /> Modifier
                        </button>
                        <button onClick={() => toggleActif(u)}
                          className="text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                          style={{ color: u.est_actif ? '#f87171' : '#22c55e' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = u.est_actif ? 'rgba(248,113,113,0.1)' : 'rgba(34,197,94,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                          {u.est_actif ? <><ShieldOff size={12} /> Désactiver</> : <><ShieldCheck size={12} /> Activer</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 sticky top-0"
              style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {erreur && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {erreur}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Prénom *', key: 'first_name', type: 'text', required: true, placeholder: 'Jean' },
                  { label: 'Nom *', key: 'last_name', type: 'text', required: true, placeholder: 'Dupont' },
                  { label: 'Username *', key: 'username', type: 'text', required: true, placeholder: 'jean.dupont' },
                  { label: editUser ? 'Nouveau mot de passe' : 'Mot de passe *', key: 'password', type: 'password', required: !editUser, placeholder: '••••••' },
                  { label: 'Téléphone', key: 'telephone', type: 'text', required: false, placeholder: '6XXXXXXXX' },
                  { label: 'Email', key: 'email', type: 'email', required: false, placeholder: 'jean@example.com' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {field.label}
                    </label>
                    <input type={field.type} required={field.required}
                      value={form[field.key]} placeholder={field.placeholder}
                      onChange={e => setForm({...form, [field.key]: e.target.value})}
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Rôle *</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                    <option value="caissier">Caissier</option>
                    <option value="gerant">Gérant</option>
                    <option value="admin">Administrateur</option>
                    <option value="serveuse">Serveuse</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input type="checkbox" id="est_actif" checked={form.est_actif}
                    onChange={e => setForm({...form, est_actif: e.target.checked})}
                    className="w-4 h-4" />
                  <label htmlFor="est_actif" className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Compte actif
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl transition font-medium text-sm"
                  style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl transition font-bold text-sm text-white"
                  style={{ backgroundColor: 'var(--color-accent)' }}>
                  {editUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}