import { format } from 'date-fns'

export const formatRand = (v?: number | null) => {
  if (v == null) return 'R—'
  return 'R ' + Math.round(v).toLocaleString('en-ZA')
}

export const formatDate = (d?: string | null) => {
  if (!d) return '—'
  try { return format(new Date(d), 'd MMM yyyy') } catch { return d }
}

export const tierLabel = (tier?: string) => {
  if (tier === '★★★') return { label: '★★★', cls: 'tier-3' }
  if (tier === '★★')  return { label: '★★',  cls: 'tier-2' }
  if (tier === '★')   return { label: '★',   cls: 'tier-1' }
  return { label: '—', cls: '' }
}

export const statusBadge = (status?: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    new:             { label: 'New',           cls: 'badge-new' },
    contacted:       { label: 'Contacted',     cls: 'badge-contacted' },
    mjr_sent:        { label: 'MJR Sent',      cls: 'badge-mjr_sent' },
    mjr_opened:      { label: 'MJR Opened',    cls: 'badge-mjr_sent' },
    call_booked:     { label: 'Call Booked',   cls: 'badge-call_booked' },
    call_completed:  { label: 'Call Done',     cls: 'badge-call_booked' },
    sprint_active:   { label: 'Sprint Active', cls: 'badge-sprint' },
    sprint_complete: { label: 'Sprint Done',   cls: 'badge-sprint' },
    results_meeting: { label: 'Results Mtg',   cls: 'badge-call_booked' },
    closed_won:      { label: 'Won ✓',         cls: 'badge-won' },
    closed_lost:     { label: 'Lost',          cls: 'badge-lost' },
    archived:        { label: 'Archived',      cls: 'badge-new' },
  }
  return map[status || ''] || { label: status || '—', cls: 'badge-new' }
}

export const catBadgeClass = (cat: string) => {
  const map: Record<string, string> = {
    SOPs: 'badge-sops', Capital: 'badge-capital', Brand: 'badge-brand',
    Templates: 'badge-templates', Legal: 'badge-legal', Systems: 'badge-systems',
    Prospects: 'badge-prospects', Italy: 'badge-italy', Network: 'badge-network',
    Outreach: 'badge-outreach', Clients: 'badge-clients', Delegate: 'badge-delegate',
  }
  return map[cat] || 'badge-systems'
}

export const monthLabel = (iso: string) => {
  try { return format(new Date(iso + '-01'), 'MMM yy') } catch { return iso }
}