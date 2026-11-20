import { useState, useEffect } from 'react'
import { ventesService } from '../../services/api'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, ShoppingBag, BarChart2, AlertTriangle,
  CreditCard, Smartphone, FileText, ArrowUpRight
} from 'lucide-react'

const KPICard = ({ titre, valeur, icone: Icon, couleur, sousTitre, tendance }) => (
  <div className="rounded-2xl p-6 relative overflow-hidden"
    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
    <div className="flex items-start justify-between mb-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${couleur}18` }}>
        <Icon size={20} style={{ color: couleur }} />
      </div>
      {tendance !== undefined && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ backgroundColor: tendance >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
          <ArrowUpRight size={12} style={{ color: tendance >= 0 ? '#22c55e' : '#ef4444',
            transform: tendance < 0 ? 'rotate(90deg)' : 'none' }} />
          <span className="text-xs font-semibold" style={{ color: tendance >= 0 ? '#22c55e' : '#ef4444' }}>
            {Math.abs(tendance)}%
          </span>
        </div>
      )}
    </div>
    <p className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--color-text)' }}>
      {valeur}
    </p>
    <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{titre}</p>
    {sousTitre && (
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>{sousTitre}</p>
    )}
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3 shadow-xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="font-bold" style={{ color: 'var(--color-accent)' }}>
          {payload[0].value.toLocaleString()} FCFA
        </p>
      </div>
    )
  }
  return null
}

const BADGE_PAIEMENT = {
  cash: { label: 'Cash', Icon: CreditCard, color: '#22c55e' },
  mobile: { label: 'Mobile Money', Icon: Smartphone, color: '#3b82f6' },
  credit: { label: 'Crédit', Icon: FileText, color: '#f59e0b' },
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [ventes, setVentes] = useState(null)
  const [dateSelectionnee, setDateSelectionnee] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [dateSelectionnee])

  const charger = async () => {
    setLoading(true)
    try {
      const [statsRes, ventesRes] = await Promise.all([
        ventesService.rapports({}),
        ventesService.journalier(dateSelectionnee),
      ])
      setStats(statsRes.data)
      setVentes(ventesRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const dateLabel = new Date(dateSelectionnee + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const aujourdhuiLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const totalPaiements = stats?.paiements
    ? Object.values(stats.paiements).reduce((a, b) => a + b, 0)
    : 0

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Chargement du tableau de bord...
      </p>
    </div>
  )

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Tableau de bord
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: 'var(--color-text-muted)' }}>
            {aujourdhuiLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">En direct</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titre="Chiffre du jour"
          valeur={`${(stats?.total_jour || 0).toLocaleString()} F`}
          icone={TrendingUp}
          couleur="#f97316"
          sousTitre={`${stats?.nb_commandes_jour || 0} commande(s)`}
        />
        <KPICard
          titre="Bénéfice du jour"
          valeur={`${Math.round(stats?.benefice_jour || 0).toLocaleString()} F`}
          icone={BarChart2}
          couleur="#22c55e"
          sousTitre="Bénéfice net estimé"
        />
        <KPICard
          titre="Chiffre du mois"
          valeur={`${(stats?.total_mois || 0).toLocaleString()} F`}
          icone={ShoppingBag}
          couleur="#3b82f6"
          sousTitre={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        />
        <KPICard
          titre="Alertes stock"
          valeur={stats?.stock_bas || 0}
          icone={AlertTriangle}
          couleur="#ef4444"
          sousTitre="Produits sous le seuil"
        />
      </div>

      {/* Graphique + Paiements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Graphique 7 jours */}
        <div className="lg:col-span-2 rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                Évolution des ventes
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                7 derniers jours
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Ventes (FCFA)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.ventes_7_jours || []}
              margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradVentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--color-border)"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <YAxis stroke="var(--color-border)"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#f97316"
                strokeWidth={2.5} fill="url(#gradVentes)"
                dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#f97316' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition paiements */}
        <div className="rounded-2xl p-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="mb-6">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              Paiements du jour
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Répartition par mode
            </p>
          </div>

          {!stats?.paiements || Object.keys(stats.paiements).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40"
              style={{ color: 'var(--color-text-muted)' }}>
              <CreditCard size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Aucun paiement aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.paiements).map(([mode, montant]) => {
                const pct = totalPaiements > 0 ? (montant / totalPaiements * 100).toFixed(0) : 0
                const badge = BADGE_PAIEMENT[mode] || { label: mode, Icon: CreditCard, color: '#6b7280' }
                const { Icon } = badge
                return (
                  <div key={mode}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: badge.color }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        {montant.toLocaleString()} F
                      </span>
                    </div>
                    <div className="w-full rounded-full h-1.5"
                      style={{ backgroundColor: 'var(--color-surface-2)' }}>
                      <div className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: badge.color }} />
                    </div>
                    <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-text-muted)' }}>
                      {pct}%
                    </p>
                  </div>
                )
              })}
              <div className="pt-3 flex justify-between"
                style={{ borderTop: '1px solid var(--color-border)' }}>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total encaissé</span>
                <span className="font-bold" style={{ color: 'var(--color-accent)' }}>
                  {totalPaiements.toLocaleString()} F
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tableau ventes journalières */}
      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              Ventes journalières
            </h2>
            <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--color-text-muted)' }}>
              {dateLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {ventes && (
              <span className="text-xs px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                {ventes.nombre} vente(s) —{' '}
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                  {(ventes.total || 0).toLocaleString()} F
                </span>
              </span>
            )}
            <input type="date" value={dateSelectionnee}
              onChange={e => setDateSelectionnee(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm focus:outline-none transition"
              style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
              {['N° Commande', 'Caissier', 'Mode paiement', 'Montant reçu', 'Monnaie rendue', 'Total', 'Heure'].map(h => (
                <th key={h} className={`text-xs font-semibold uppercase tracking-wider px-6 py-3 ${h === 'N° Commande' || h === 'Caissier' || h === 'Mode paiement' ? 'text-left' : 'text-right'}`}
                  style={{ color: 'var(--color-text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(ventes?.ventes || []).length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2"
                    style={{ color: 'var(--color-text-muted)' }}>
                    <BarChart2 size={40} className="opacity-20" />
                    <p className="text-sm">Aucune vente enregistrée pour cette date</p>
                  </div>
                </td>
              </tr>
            ) : (
              (ventes?.ventes || []).map((v, i) => {
                const badge = BADGE_PAIEMENT[v.mode_paiement]
                const Icon = badge?.Icon || CreditCard
                return (
                  <tr key={v.id}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-accent)' }}>
                        #{v.commande_numero}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {v.caissier_nom || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: badge?.color || '#6b7280' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                          {badge?.label || v.mode_paiement}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {Number(v.montant_recu).toLocaleString()} F
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <span style={{ color: Number(v.monnaie_rendue) > 0 ? '#22c55e' : 'var(--color-text-muted)' }}>
                        {Number(v.monnaie_rendue).toLocaleString()} F
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                        {Number(v.montant_total).toLocaleString()} F
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(v.date_vente).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {(ventes?.ventes || []).length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
                <td colSpan={5} className="px-6 py-4 text-sm font-medium"
                  style={{ color: 'var(--color-text-muted)' }}>
                  Total journalier — {ventes?.nombre || 0} transaction(s)
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
                    {(ventes?.total || 0).toLocaleString()} F
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}