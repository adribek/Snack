import { useState } from 'react'
import { Printer, X } from 'lucide-react'
import { afficherTicket, imprimerTicket } from '../utils/ticket'

export default function ModalTicket({ commande, vente, onFermer }) {
  const ticketHTML = afficherTicket(commande, vente)

  const handleImprimer = () => {
    imprimerTicket(commande, vente)
    onFermer()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-sm overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Ticket #{commande.numero}
          </h2>
          <button onClick={onFermer}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
            <X size={18} />
          </button>
        </div>

        {/* Aperçu ticket */}
        <div className="p-4">
          <div className="rounded-xl overflow-hidden border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: '#fff' }}>
            <iframe
              srcDoc={ticketHTML}
              style={{ width: '100%', height: '350px', border: 'none' }}
              title="Aperçu ticket"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button onClick={onFermer}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm transition"
            style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
            Ignorer
          </button>
          <button onClick={handleImprimer}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--color-accent)' }}>
            <Printer size={16} />
            Imprimer
          </button>
        </div>
      </div>
    </div>
  )
}