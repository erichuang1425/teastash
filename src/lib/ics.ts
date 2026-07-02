import type { TeaItem } from '../types'

function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  // RFC 5545 requires folding lines longer than 75 octets; keep it simple/ASCII-safe.
  if (line.length <= 75) return line
  const chunks: string[] = []
  let rest = line
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75))
    rest = ' ' + rest.slice(75)
  }
  chunks.push(rest)
  return chunks.join('\r\n')
}

export function buildExpiryIcs(teas: TeaItem[], appLabel: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TeaStash//Expiry Reminders//EN',
    'CALSCALE:GREGORIAN',
  ]

  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  for (const tea of teas) {
    if (tea.openedExpiryDate) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:${tea.id}-opened@teastash`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${toIcsDate(tea.openedExpiryDate)}`,
        `SUMMARY:${escapeIcsText(`${appLabel}: ${tea.name} — opened expiry`)}`,
        'END:VEVENT',
      )
    }
    if (tea.unopenedExpiryDate) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:${tea.id}-unopened@teastash`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${toIcsDate(tea.unopenedExpiryDate)}`,
        `SUMMARY:${escapeIcsText(`${appLabel}: ${tea.name} — unopened expiry`)}`,
        'END:VEVENT',
      )
    }
  }

  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n')
}
