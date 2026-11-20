import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard, ShoppingCart, ClipboardList, UtensilsCrossed,
  Tag, Package, TrendingUp, Users, LogOut, Menu, Sun, Moon, Utensils, 
  ShieldCheck
} from 'lucide-react'

import logo from '../assets/logoBL.png'

const getNavItems = (role) => {
  const tous = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['admin', 'gerant', 'caissier'] },    { to: '/caisse', icon: ShoppingCart, label: 'Caisse (POS)', roles: ['admin', 'gerant', 'caissier'] },
    { to: '/commandes', icon: ClipboardList, label: 'Commandes', roles: ['admin', 'gerant', 'caissier'] },
    { to: '/produits', icon: UtensilsCrossed, label: 'Produits', roles: ['admin', 'gerant'] },
    { to: '/categories', icon: Tag, label: 'Catégories', roles: ['admin', 'gerant'] },
    { to: '/stock', icon: Package, label: 'Stock', roles: ['admin', 'gerant'] },
    { to: '/ventes', icon: TrendingUp, label: 'Ventes', roles: ['admin', 'gerant'] },
    { to: '/employes', icon: Users, label: 'Employés', roles: ['admin', 'gerant'] },
    { to: '/utilisateurs', icon: ShieldCheck, label: 'Utilisateurs', roles: ['admin'] },
    { to: '/serveuse', icon: Utensils, label: 'Espace serveuse', roles: ['admin', 'gerant', 'serveuse'] },
  ]
  return tous.filter(item => item.roles.includes(role))
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => { logout(); navigate('/login') }
  const navItems = getNavItems(user?.role || 'caissier')

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col transition-all duration-300`}
        style={{ backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>

        {/* Logo */}
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <img src={logo} alt="Barbecue Leader" className="w-full h-full object-contain" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Barbecue Leader</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Gestion snack</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium"
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                })}
                onMouseEnter={e => {
                  if (!e.currentTarget.getAttribute('aria-current')) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'
                    e.currentTarget.style.color = 'var(--color-text)'
                  }
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.getAttribute('aria-current')) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-muted)'
                  }
                }}>
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Thème */}
        <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition text-sm"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-text-muted)' }}>
            {theme === 'sombre' ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
            {sidebarOpen && <span>{theme === 'sombre' ? 'Mode clair' : 'Mode sombre'}</span>}
          </button>
        </div>

        {/* User */}
        <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          {sidebarOpen && (
            <div className="mb-3 px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--color-surface-2)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {user?.first_name || user?.username}
              </p>
              <p className="text-xs mt-0.5 font-medium capitalize" style={{ color: 'var(--color-accent)' }}>
                {user?.role === 'admin' ? 'Administrateur' 
                  : user?.role === 'gerant' ? 'Gérant' 
                  : user?.role === 'serveuse' ? 'Serveuse'
                  : user?.role === 'securite' ? 'Sécurité'
                  : user?.role === 'manager' ? 'Manager'
                  : user?.role === 'cuisinier' ? 'Cuisinier'
                  : user?.role === 'dj' ? 'DJ'
                  : user?.role === 'chef_salle' ? 'Chef de salle'
                  : user?.role === 'directeur' ? 'Directeur'
                  : 'Caissier'}
              </p>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition text-sm"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-text-muted)' }}>
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 flex items-center gap-4"
          style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: 'var(--color-text-muted)' }}
            className="hover:opacity-80 transition">
            <Menu size={20} />
          </button>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Bienvenue, <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{user?.first_name || user?.username}</span>
          </p>
        </header>
        <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'var(--color-bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}