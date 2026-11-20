import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Produits from './pages/produits/Produits'
import Categories from './pages/produits/Categories'
import Caisse from './pages/caisse/Caisse'
import Commandes from './pages/commandes/Commandes'
import Stock from './pages/stock/Stock'
import Ventes from './pages/ventes/Ventes'
import Employes from './pages/employes/Employes'
import Utilisateurs from './pages/utilisateurs/Utilisateurs'
import Serveuse from './pages/serveuse/Serveuse'

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />
  return children
}

const RoleRedirect = () => {
  const { user } = useAuth()
  if (user?.role === 'serveuse') return <Navigate to="/serveuse" />
  return <Dashboard />
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={
                <PrivateRoute>
                  <RoleRedirect />
                </PrivateRoute>
              } />
              <Route path="dashboard" element={
                <PrivateRoute roles={['admin', 'gerant', 'caissier']}>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="caisse" element={
                <PrivateRoute roles={['admin', 'gerant', 'caissier']}>
                  <Caisse />
                </PrivateRoute>
              } />
              <Route path="commandes" element={
                <PrivateRoute roles={['admin', 'gerant', 'caissier']}>
                  <Commandes />
                </PrivateRoute>
              } />
              <Route path="produits" element={
                <PrivateRoute roles={['admin', 'gerant']}>
                  <Produits />
                </PrivateRoute>
              } />
              <Route path="categories" element={
                <PrivateRoute roles={['admin', 'gerant']}>
                  <Categories />
                </PrivateRoute>
              } />
              <Route path="stock" element={
                <PrivateRoute roles={['admin', 'gerant']}>
                  <Stock />
                </PrivateRoute>
              } />
              <Route path="ventes" element={
                <PrivateRoute roles={['admin', 'gerant']}>
                  <Ventes />
                </PrivateRoute>
              } />
              <Route path="employes" element={
                <PrivateRoute roles={['admin', 'gerant']}>
                  <Employes />
                </PrivateRoute>
              } />
              <Route path="utilisateurs" element={
                <PrivateRoute roles={['admin']}>
                  <Utilisateurs />
                </PrivateRoute>
              } />
              <Route path="serveuse" element={
                <PrivateRoute roles={['admin', 'gerant', 'serveuse']}>
                  <Serveuse />
                </PrivateRoute>
              } />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}