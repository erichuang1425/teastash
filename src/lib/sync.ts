import type { SupabaseClient } from '@supabase/supabase-js'
import type { SyncEntity, SyncTombstone, TeaItem, TeaType, UsagePurpose, UsageRecord } from '../types'

interface RemoteTeaRow {
  id: string
  user_id: string
  name: string
  brand: string | null
  tea_type: string
  net_weight_g: number
  remaining_g: number
  purchase_date: string | null
  opened_date: string | null
  unopened_expiry_date: string | null
  opened_expiry_date: string | null
  storage_location: string | null
  notes: string | null
  image_data_url: string | null
  tin_color: string | null
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface RemoteUsageRecordRow {
  id: string
  user_id: string
  tea_id: string
  date: string
  time: string
  grams_used: number
  purpose: string
  notes: string | null
  remaining_after: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface RemoteTombstoneRow {
  id: string
  user_id: string
  entity: string
  item_id: string
  updated_at: string
}

export interface TeaStashSyncResult {
  teas: TeaItem[]
  usageRecords: UsageRecord[]
  tombstoneIdsToRemove: string[]
  syncedAt: string
}

const TEA_TYPES: TeaType[] = ['matcha', 'sencha', 'genmaicha', 'houjicha', 'oolong', 'blackTea', 'puerh', 'other']
const PURPOSES: UsagePurpose[] = ['usucha', 'koicha', 'latte', 'dessert', 'other']

function timestamp(value: string | null | undefined): number {
  const parsed = Date.parse(value ?? '')
  return Number.isFinite(parsed) ? parsed : 0
}

function isNewerOrSame(left: string, right: string): boolean {
  return timestamp(left) >= timestamp(right)
}

function latest<T extends { id: string; updatedAt: string }>(values: T[]): Map<string, T> {
  const result = new Map<string, T>()
  for (const value of values) {
    const existing = result.get(value.id)
    if (!existing || isNewerOrSame(value.updatedAt, existing.updatedAt)) {
      result.set(value.id, value)
    }
  }
  return result
}

function asTeaType(value: string): TeaType {
  return TEA_TYPES.includes(value as TeaType) ? (value as TeaType) : 'other'
}

function asPurpose(value: string): UsagePurpose {
  return PURPOSES.includes(value as UsagePurpose) ? (value as UsagePurpose) : 'other'
}

function isSyncEntity(value: string): value is SyncEntity {
  return value === 'tea' || value === 'usage_record'
}

export function normalizeUsageRecord(record: UsageRecord): UsageRecord {
  return {
    ...record,
    updatedAt: record.updatedAt || record.createdAt,
  }
}

export function createSyncTombstone(entity: SyncEntity, itemId: string, updatedAt: string): SyncTombstone {
  return {
    id: `${entity}:${itemId}`,
    entity,
    itemId,
    updatedAt,
  }
}

export function mergeTombstones(existing: SyncTombstone[], additions: SyncTombstone[]): SyncTombstone[] {
  const byId = new Map<string, SyncTombstone>()
  for (const tombstone of [...existing, ...additions]) {
    const current = byId.get(tombstone.id)
    if (!current || isNewerOrSame(tombstone.updatedAt, current.updatedAt)) {
      byId.set(tombstone.id, tombstone)
    }
  }
  return [...byId.values()]
}

function teaFromRemote(row: RemoteTeaRow): TeaItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? '',
    teaType: asTeaType(row.tea_type),
    netWeightG: row.net_weight_g,
    remainingG: row.remaining_g,
    purchaseDate: row.purchase_date,
    openedDate: row.opened_date,
    unopenedExpiryDate: row.unopened_expiry_date,
    openedExpiryDate: row.opened_expiry_date,
    storageLocation: row.storage_location ?? '',
    notes: row.notes ?? '',
    imageDataUrl: row.image_data_url,
    tinColor: row.tin_color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function teaToRemote(tea: TeaItem, userId: string): RemoteTeaRow {
  return {
    id: tea.id,
    user_id: userId,
    name: tea.name,
    brand: tea.brand || null,
    tea_type: tea.teaType,
    net_weight_g: tea.netWeightG,
    remaining_g: tea.remainingG,
    purchase_date: tea.purchaseDate,
    opened_date: tea.openedDate,
    unopened_expiry_date: tea.unopenedExpiryDate,
    opened_expiry_date: tea.openedExpiryDate,
    storage_location: tea.storageLocation || null,
    notes: tea.notes || null,
    image_data_url: tea.imageDataUrl,
    tin_color: tea.tinColor,
    sort_order: tea.sortOrder,
    created_at: tea.createdAt,
    updated_at: tea.updatedAt,
    deleted_at: null,
  }
}

function recordFromRemote(row: RemoteUsageRecordRow): UsageRecord {
  return {
    id: row.id,
    teaId: row.tea_id,
    date: row.date,
    time: row.time,
    gramsUsed: row.grams_used,
    purpose: asPurpose(row.purpose),
    notes: row.notes ?? '',
    remainingAfter: row.remaining_after,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function recordToRemote(record: UsageRecord, userId: string): RemoteUsageRecordRow {
  const normalized = normalizeUsageRecord(record)
  return {
    id: normalized.id,
    user_id: userId,
    tea_id: normalized.teaId,
    date: normalized.date,
    time: normalized.time,
    grams_used: normalized.gramsUsed,
    purpose: normalized.purpose,
    notes: normalized.notes || null,
    remaining_after: normalized.remainingAfter,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt,
    deleted_at: null,
  }
}

function tombstoneFromRemote(row: RemoteTombstoneRow): SyncTombstone | null {
  if (!isSyncEntity(row.entity)) return null
  return {
    id: row.id,
    entity: row.entity,
    itemId: row.item_id,
    updatedAt: row.updated_at,
  }
}

function tombstoneToRemote(tombstone: SyncTombstone, userId: string): RemoteTombstoneRow {
  return {
    id: tombstone.id,
    user_id: userId,
    entity: tombstone.entity,
    item_id: tombstone.itemId,
    updated_at: tombstone.updatedAt,
  }
}

function tableTombstone(entity: SyncEntity, itemId: string, updatedAt: string): SyncTombstone {
  return createSyncTombstone(entity, itemId, updatedAt)
}

async function throwOnError(error: { message: string } | null): Promise<void> {
  if (error) throw new Error(error.message)
}

async function markRemoteDeleted(
  supabase: SupabaseClient,
  userId: string,
  tombstone: SyncTombstone,
): Promise<void> {
  const table = tombstone.entity === 'tea' ? 'teas' : 'usage_records'
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: tombstone.updatedAt, updated_at: tombstone.updatedAt })
    .eq('user_id', userId)
    .eq('id', tombstone.itemId)
  await throwOnError(error)
}

export async function syncTeaStash({
  supabase,
  userId,
  teas,
  usageRecords,
  tombstones,
}: {
  supabase: SupabaseClient
  userId: string
  teas: TeaItem[]
  usageRecords: UsageRecord[]
  tombstones: SyncTombstone[]
}): Promise<TeaStashSyncResult> {
  const [teaResponse, recordResponse, tombstoneResponse] = await Promise.all([
    supabase.from('teas').select('*').eq('user_id', userId),
    supabase.from('usage_records').select('*').eq('user_id', userId),
    supabase.from('sync_tombstones').select('*').eq('user_id', userId),
  ])

  await throwOnError(teaResponse.error)
  await throwOnError(recordResponse.error)
  await throwOnError(tombstoneResponse.error)

  const remoteTeaRows = (teaResponse.data ?? []) as RemoteTeaRow[]
  const remoteRecordRows = (recordResponse.data ?? []) as RemoteUsageRecordRow[]
  const remoteTombstoneRows = (tombstoneResponse.data ?? []) as RemoteTombstoneRow[]

  const remoteTombstones = remoteTombstoneRows.map(tombstoneFromRemote).filter((x): x is SyncTombstone => x !== null)
  for (const row of remoteTeaRows) {
    if (row.deleted_at) remoteTombstones.push(tableTombstone('tea', row.id, row.deleted_at))
  }
  for (const row of remoteRecordRows) {
    if (row.deleted_at) remoteTombstones.push(tableTombstone('usage_record', row.id, row.deleted_at))
  }

  const allTombstones = mergeTombstones(tombstones, remoteTombstones)
  const mergedTeas = latest([
    ...teas,
    ...remoteTeaRows.filter((row) => !row.deleted_at).map(teaFromRemote),
  ])
  const mergedRecords = latest([
    ...usageRecords.map(normalizeUsageRecord),
    ...remoteRecordRows.filter((row) => !row.deleted_at).map(recordFromRemote),
  ])

  for (const tombstone of allTombstones) {
    if (tombstone.entity === 'tea') {
      const tea = mergedTeas.get(tombstone.itemId)
      if (tea && isNewerOrSame(tombstone.updatedAt, tea.updatedAt)) {
        mergedTeas.delete(tombstone.itemId)
      }
    } else {
      const record = mergedRecords.get(tombstone.itemId)
      if (record && isNewerOrSame(tombstone.updatedAt, record.updatedAt)) {
        mergedRecords.delete(tombstone.itemId)
      }
    }
  }

  const teaIds = new Set(mergedTeas.keys())
  for (const record of mergedRecords.values()) {
    if (!teaIds.has(record.teaId)) {
      mergedRecords.delete(record.id)
    }
  }

  const activeTombstones = allTombstones.filter((tombstone) => {
    if (tombstone.entity === 'tea') {
      const tea = mergedTeas.get(tombstone.itemId)
      return !tea || isNewerOrSame(tombstone.updatedAt, tea.updatedAt)
    }
    const record = mergedRecords.get(tombstone.itemId)
    return !record || isNewerOrSame(tombstone.updatedAt, record.updatedAt)
  })

  const mergedTeaRows = [...mergedTeas.values()].map((tea) => teaToRemote(tea, userId))
  const mergedRecordRows = [...mergedRecords.values()].map((record) => recordToRemote(record, userId))

  if (mergedTeaRows.length > 0) {
    const { error } = await supabase.from('teas').upsert(mergedTeaRows, { onConflict: 'user_id,id' })
    await throwOnError(error)
  }

  if (mergedRecordRows.length > 0) {
    const { error } = await supabase.from('usage_records').upsert(mergedRecordRows, { onConflict: 'user_id,id' })
    await throwOnError(error)
  }

  if (activeTombstones.length > 0) {
    const { error } = await supabase
      .from('sync_tombstones')
      .upsert(activeTombstones.map((tombstone) => tombstoneToRemote(tombstone, userId)), { onConflict: 'user_id,id' })
    await throwOnError(error)
    await Promise.all(activeTombstones.map((tombstone) => markRemoteDeleted(supabase, userId, tombstone)))
  }

  return {
    teas: [...mergedTeas.values()],
    usageRecords: [...mergedRecords.values()],
    tombstoneIdsToRemove: tombstones.map((tombstone) => tombstone.id),
    syncedAt: new Date().toISOString(),
  }
}
