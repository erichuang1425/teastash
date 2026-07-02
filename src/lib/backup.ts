import type { BackupPayload, TeaItem, TeaType, UsagePurpose, UsageRecord } from '../types'
import { createId } from './id'

const SCHEMA_VERSION = 2

export function buildBackup(teas: TeaItem[], usageRecords: UsageRecord[]): BackupPayload {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'teastash',
    teas,
    usageRecords,
  }
}

export function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  triggerDownload(blob, filename)
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export class BackupParseError extends Error {}

export function parseBackupFile(text: string): { teas: TeaItem[]; usageRecords: UsageRecord[] } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupParseError('invalid-json')
  }
  if (
    typeof data !== 'object' ||
    data === null ||
    (data as { app?: string }).app !== 'teastash' ||
    !Array.isArray((data as { teas?: unknown }).teas) ||
    !Array.isArray((data as { usageRecords?: unknown }).usageRecords)
  ) {
    throw new BackupParseError('invalid-shape')
  }
  return sanitizeBackup(data as BackupPayload)
}

const TEA_TYPES: TeaType[] = ['matcha', 'sencha', 'genmaicha', 'houjicha', 'oolong', 'blackTea', 'puerh', 'other']
const PURPOSES: UsagePurpose[] = ['usucha', 'koicha', 'latte', 'dessert', 'other']
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asIsoDateOrNull(value: unknown): string | null {
  return typeof value === 'string' && ISO_DATE_RE.test(value) ? value : null
}

/**
 * Field-level cleanup of an imported backup: coerces types, clamps grams,
 * drops teas without a usable identity and records that point at missing
 * teas, so one malformed entry can't corrupt the whole dataset.
 */
export function sanitizeBackup(payload: BackupPayload): { teas: TeaItem[]; usageRecords: UsageRecord[] } {
  const now = new Date().toISOString()

  const teas: TeaItem[] = []
  for (const raw of payload.teas as unknown[]) {
    if (typeof raw !== 'object' || raw === null) continue
    const obj = raw as Record<string, unknown>
    const name = asString(obj.name).trim()
    if (!name) continue

    const netWeightG = Math.max(0, asNumber(obj.netWeightG))
    let remainingG = Math.max(0, asNumber(obj.remainingG))
    if (netWeightG > 0) remainingG = Math.min(remainingG, netWeightG)

    const teaType = asString(obj.teaType) as TeaType
    const imageDataUrl = asString(obj.imageDataUrl)
    const tinColor = asString(obj.tinColor)

    teas.push({
      id: asString(obj.id) || createId(),
      name,
      brand: asString(obj.brand),
      teaType: TEA_TYPES.includes(teaType) ? teaType : 'other',
      netWeightG,
      remainingG,
      purchaseDate: asIsoDateOrNull(obj.purchaseDate),
      openedDate: asIsoDateOrNull(obj.openedDate),
      unopenedExpiryDate: asIsoDateOrNull(obj.unopenedExpiryDate),
      openedExpiryDate: asIsoDateOrNull(obj.openedExpiryDate),
      storageLocation: asString(obj.storageLocation),
      notes: asString(obj.notes),
      imageDataUrl: imageDataUrl.startsWith('data:image/') ? imageDataUrl : null,
      tinColor: /^#[0-9a-fA-F]{6}$/.test(tinColor) ? tinColor : null,
      sortOrder: asNumber(obj.sortOrder),
      createdAt: asString(obj.createdAt, now),
      updatedAt: asString(obj.updatedAt, now),
    })
  }

  const teaIds = new Set(teas.map((t) => t.id))

  const usageRecords: UsageRecord[] = []
  for (const raw of payload.usageRecords as unknown[]) {
    if (typeof raw !== 'object' || raw === null) continue
    const obj = raw as Record<string, unknown>
    const teaId = asString(obj.teaId)
    const date = asIsoDateOrNull(obj.date)
    const gramsUsed = asNumber(obj.gramsUsed)
    if (!teaIds.has(teaId) || !date || gramsUsed <= 0) continue

    const time = asString(obj.time)
    const purpose = asString(obj.purpose) as UsagePurpose

    usageRecords.push({
      id: asString(obj.id) || createId(),
      teaId,
      date,
      time: TIME_RE.test(time) ? time : '00:00',
      gramsUsed,
      purpose: PURPOSES.includes(purpose) ? purpose : 'other',
      notes: asString(obj.notes),
      remainingAfter: Math.max(0, asNumber(obj.remainingAfter)),
      createdAt: asString(obj.createdAt, now),
      updatedAt: asString(obj.updatedAt, asString(obj.createdAt, now)),
    })
  }

  return { teas, usageRecords }
}
