import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  sombre: {
    nom: 'Dark (VS Code)', icone: '🌙',
    '--color-bg': '#1e1e1e',
    '--color-surface': '#252526',
    '--color-surface-2': '#2d2d30',
    '--color-border': '#3e3e42',
    '--color-text': '#d4d4d4',
    '--color-text-muted': '#858585',
    '--color-accent': '#f97316',
    '--color-accent-hover': '#ea580c',
    '--color-accent-subtle': 'rgba(249,115,22,0.1)',
  },
  clair: {
    nom: 'Light (VS Code)', icone: '☀️',
    '--color-bg': '#ffffff',
    '--color-surface': '#f3f3f3',
    '--color-surface-2': '#ebebeb',
    '--color-border': '#e0e0e0',
    '--color-text': '#333333',
    '--color-text-muted': '#717171',
    '--color-accent': '#f97316',
    '--color-accent-hover': '#ea580c',
    '--color-accent-subtle': 'rgba(249,115,22,0.1)',
  },
}

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    const vars = THEMES[theme]
    Object.entries(vars).forEach(([key, val]) => {
      if (key.startsWith('--')) {
        document.documentElement.style.setProperty(key, val)
      }
    })
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'sombre' ? 'clair' : 'sombre')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)