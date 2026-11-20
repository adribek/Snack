import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Intercepteur request — ajoute le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur response — gère le token expiré
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        }
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  moi: () => api.get('/auth/moi/'),
  utilisateurs: () => api.get('/auth/utilisateurs/'),
  creerUtilisateur: (data) => api.post('/auth/utilisateurs/', data),
  modifierUtilisateur: (id, data) => api.patch(`/auth/utilisateurs/${id}/`, data),
}

export const produitsService = {
  liste: () => api.get('/produits/'),
  detail: (id) => api.get(`/produits/${id}/`),
  creer: (data) => api.post('/produits/', data, {
    headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' }
  }),
  modifier: (id, data) => api.patch(`/produits/${id}/`, data, {
    headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' }
  }),
  supprimer: (id) => api.delete(`/produits/${id}/`),
  categories: () => api.get('/produits/categories/'),
  creerCategorie: (data) => api.post('/produits/categories/', data),
  modifierCategorie: (id, data) => api.put(`/produits/categories/${id}/`, data),
  supprimerCategorie: (id) => api.delete(`/produits/categories/${id}/`),
}

export const commandesService = {
  liste: () => api.get('/commandes/'),
  detail: (id) => api.get(`/commandes/${id}/`),
  creer: (data) => api.post('/commandes/', data),
  modifier: (id, data) => api.patch(`/commandes/${id}/`, data),
  changerStatut: (id, statut) => api.patch(`/commandes/${id}/statut/`, { statut }),
  encaisser: (id, data) => api.post(`/commandes/${id}/encaisser/`, data),
  tables: () => api.get('/commandes/tables/'),
}

export const ventesService = {
  liste: (params) => api.get('/ventes/', { params }),
  journalier: (date) => api.get(`/ventes/journalier/?date=${date}`),
  rapports: (params) => api.get('/ventes/dashboard/', { params }),
  periode: (params) => api.get('/ventes/periode/', { params }),
}

export const stockService = {
  mouvements: () => api.get('/stock/'),
  ajuster: (data) => api.post('/stock/ajuster/', data),
  alertes: () => api.get('/stock/alertes/'),
}

export const employesService = {
  liste: () => api.get('/employes/'),
  detail: (id) => api.get(`/employes/${id}/`),
  creer: (data) => api.post('/employes/', data, {
    headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' }
  }),
  modifier: (id, data) => api.patch(`/employes/${id}/`, data, {
    headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' }
  }),
  toggleActif: (userId, estActif) => api.patch(`/auth/utilisateurs/${userId}/`, { est_actif: estActif }),
}

export default api