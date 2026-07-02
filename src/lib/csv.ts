import type { TeaItem, UsageRecord } from '../types'

function csvEscape(value: string | number): string {
  const s = String(value)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function usageRecordsToCsv(records: UsageRecord[], teasById: Map<string, TeaItem>): string {
  const header = ['Date', 'Time', 'Tea', 'Brand', 'Grams Used', 'Purpose', 'Remaining After', 'Notes']
  const rows = records.map((r) => {
    const tea = teasById.get(r.teaId)
    return [
      r.date,
      r.time,
      tea?.name ?? '',
      tea?.brand ?? '',
      r.gramsUsed,
      r.purpose,
      r.remainingAfter,
      r.notes,
    ]
      .map(csvEscape)
      .join(',')
  })
  return [header.join(','), ...rows].join('\n')
}
