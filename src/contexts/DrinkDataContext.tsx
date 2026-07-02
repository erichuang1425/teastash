import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DrinkRecord, DrinkSize, DrinkType, SyncStatus } from '../types'
import { teaStashDb } from '../lib/db'
import { createId } from '../lib/id'
import { nowISODateTime } from '../lib/date'
import { sortRecordsNewestFirst } from '../lib/drinkLogic'
import { useSupabaseAuth } from './SupabaseAuthContext'

interface RemoteDrinkRecordRow {
  id: string
  user_id: string
  date: string
  time: string
  name: string | null
  drink_type: string
  size: string
  caffeine_mg: number
  spend_amount: number
  sugar_g: number
  homemade: boolean
  brewing_details: string | null
  notes: string | null
  image_data_url: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type DrinkInput = Omit<DrinkRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

interface DrinkDataContextValue {
  records: DrinkRecord[]
  isLoading: boolean
  syncStatus: SyncStatus
  syncNow: () => Promise<void>
  addDrinkRecord: (input: DrinkInput) => Promise<DrinkRecord>
  updateDrinkRecord: (id: string, input: DrinkInput) => Promise<void>
  deleteDrinkRecord: (id: string) => Promise<void>
  clearAllDrinkRecords: () => Promise<void>
}

const DRINK_TYPES: DrinkType[] = [
  'tea',
  'greenTea',
  'oolongTea',
  'blackTea',
  'milkTea',
  'powderedTea',
  'coffee',
  'espresso',
  'latte',
  'homemade',
  'energyDrink',
  'other',
]
const DRINK_SIZES: DrinkSize[] = ['small', 'medium', 'large', 'custom']
const INITIAL_SYNC_STATUS: SyncStatus = { state: 'idle', lastSyncedAt: null, error: null }

const DrinkDataContext = createContext<DrinkDataContextValue | null>(null)

function asDrinkType(value: string): DrinkType {
  return DRINK_TYPES.includes(value as DrinkType) ? (value as DrinkType) : 'other'
}

function asDrinkSize(value: string): DrinkSize {
  return DRINK_SIZES.includes(value as DrinkSize) ? (value as DrinkSize) : 'medium'
}

function numberOrZero(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function recordFromRemote(row: RemoteDrinkRecordRow): DrinkRecord {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    time: row.time,
    name: row.name ?? '',
    drinkType: asDrinkType(row.drink_type),
    size: asDrinkSize(row.size),
    caffeineMg: numberOrZero(row.caffeine_mg),
    spendAmount: numberOrZero(row.spend_amount),
    sugarG: numberOrZero(row.sugar_g),
    homemade: Boolean(row.homemade),
    brewingDetails: row.brewing_details ?? '',
    notes: row.notes ?? '',
    imageDataUrl: row.image_data_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function recordToRemote(record: DrinkRecord): RemoteDrinkRecordRow {
  return {
    id: record.id,
    user_id: record.userId,
    date: record.date,
    time: record.time,
    name: record.name || null,
    drink_type: record.drinkType,
    size: record.size,
    caffeine_mg: record.caffeineMg,
    spend_amount: record.spendAmount,
    sugar_g: record.sugarG,
    homemade: record.homemade,
    brewing_details: record.brewingDetails || null,
    notes: record.notes || null,
    image_data_url: record.imageDataUrl,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    deleted_at: null,
  }
}

function isNewer(left: DrinkRecord, right: DrinkRecord): boolean {
  return Date.parse(left.updatedAt) >= Date.parse(right.updatedAt)
}

function mergeLatest(local: DrinkRecord[], remote: DrinkRecord[]): DrinkRecord[] {
  const byId = new Map<string, DrinkRecord>()
  for (const record of [...local, ...remote]) {
    const existing = byId.get(record.id)
    if (!existing || isNewer(record, existing)) {
      byId.set(record.id, record)
    }
  }
  return sortRecordsNewestFirst([...byId.values()])
}

async function fetchRemoteRecords(supabase: SupabaseClient, userId: string): Promise<DrinkRecord[]> {
  const { data, error } = await supabase
    .from('drink_records')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)
  return ((data ?? []) as RemoteDrinkRecordRow[]).map(recordFromRemote)
}

async function upsertRemoteRecords(supabase: SupabaseClient, records: DrinkRecord[]): Promise<void> {
  if (records.length === 0) return
  const { error } = await supabase
    .from('drink_records')
    .upsert(records.map(recordToRemote), { onConflict: 'user_id,id' })
  if (error) throw new Error(error.message)
}

export function DrinkDataProvider({ children }: { children: ReactNode }) {
  const { client: supabase, isConfigured, isLoading: authLoading, user } = useSupabaseAuth()
  const userId = user?.id ?? null
  const [records, setRecords] = useState<DrinkRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(INITIAL_SYNC_STATUS)
  const recordsRef = useRef<DrinkRecord[]>([])
  recordsRef.current = records

  const loadRecords = useCallback(async () => {
    if (authLoading) return
    if (!userId) {
      setRecords([])
      setSyncStatus({ state: isConfigured ? 'signedOut' : 'disabled', lastSyncedAt: null, error: null })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const local = sortRecordsNewestFirst(await teaStashDb.getDrinkRecordsForUser(userId))
    setRecords(local)

    if (!isConfigured || !supabase) {
      setSyncStatus({ state: 'disabled', lastSyncedAt: null, error: null })
      setIsLoading(false)
      return
    }

    try {
      setSyncStatus((prev) => ({ ...prev, state: 'syncing', error: null }))
      const remote = await fetchRemoteRecords(supabase, userId)
      const merged = mergeLatest(local, remote)
      await teaStashDb.replaceDrinkRecordsForUser(userId, merged)
      await upsertRemoteRecords(supabase, merged)
      setRecords(merged)
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date().toISOString(), error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'
      setSyncStatus((prev) => ({ state: 'error', lastSyncedAt: prev.lastSyncedAt, error: message }))
    } finally {
      setIsLoading(false)
    }
  }, [authLoading, isConfigured, supabase, userId])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  const syncNow = useCallback(async (): Promise<void> => {
    if (!userId) {
      setSyncStatus({ state: isConfigured ? 'signedOut' : 'disabled', lastSyncedAt: null, error: null })
      return
    }
    if (!isConfigured || !supabase) {
      setSyncStatus({ state: 'disabled', lastSyncedAt: null, error: null })
      return
    }

    try {
      setSyncStatus((prev) => ({ ...prev, state: 'syncing', error: null }))
      const local = sortRecordsNewestFirst(await teaStashDb.getDrinkRecordsForUser(userId))
      const remote = await fetchRemoteRecords(supabase, userId)
      const merged = mergeLatest(local, remote)
      await teaStashDb.replaceDrinkRecordsForUser(userId, merged)
      await upsertRemoteRecords(supabase, merged)
      setRecords(merged)
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date().toISOString(), error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'
      setSyncStatus((prev) => ({ state: 'error', lastSyncedAt: prev.lastSyncedAt, error: message }))
    }
  }, [isConfigured, supabase, userId])

  const saveRemote = useCallback(
    async (nextRecords: DrinkRecord[]) => {
      if (!userId || !isConfigured || !supabase) return
      try {
        await upsertRemoteRecords(supabase, nextRecords)
        setSyncStatus({ state: 'synced', lastSyncedAt: new Date().toISOString(), error: null })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sync failed'
        setSyncStatus((prev) => ({ state: 'error', lastSyncedAt: prev.lastSyncedAt, error: message }))
      }
    },
    [isConfigured, supabase, userId],
  )

  const addDrinkRecord = useCallback(
    async (input: DrinkInput): Promise<DrinkRecord> => {
      if (!userId) throw new Error('auth-required')
      const now = nowISODateTime()
      const record: DrinkRecord = { ...input, id: createId(), userId, createdAt: now, updatedAt: now }
      await teaStashDb.putDrinkRecord(record)
      const nextRecords = sortRecordsNewestFirst([...recordsRef.current, record])
      setRecords(nextRecords)
      await saveRemote([record])
      return record
    },
    [saveRemote, userId],
  )

  const updateDrinkRecord = useCallback(
    async (id: string, input: DrinkInput): Promise<void> => {
      if (!userId) throw new Error('auth-required')
      const existing = recordsRef.current.find((record) => record.id === id)
      if (!existing) throw new Error('record-not-found')
      const updated: DrinkRecord = { ...existing, ...input, id, userId, createdAt: existing.createdAt, updatedAt: nowISODateTime() }
      await teaStashDb.putDrinkRecord(updated)
      const nextRecords = sortRecordsNewestFirst(recordsRef.current.map((record) => (record.id === id ? updated : record)))
      setRecords(nextRecords)
      await saveRemote([updated])
    },
    [saveRemote, userId],
  )

  const deleteDrinkRecord = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) throw new Error('auth-required')
      await teaStashDb.deleteDrinkRecord(id)
      setRecords((prev) => prev.filter((record) => record.id !== id))
      if (!isConfigured || !supabase) return
      try {
        const { error } = await supabase.from('drink_records').delete().eq('user_id', userId).eq('id', id)
        if (error) throw new Error(error.message)
        setSyncStatus({ state: 'synced', lastSyncedAt: new Date().toISOString(), error: null })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sync failed'
        setSyncStatus((prev) => ({ state: 'error', lastSyncedAt: prev.lastSyncedAt, error: message }))
      }
    },
    [isConfigured, supabase, userId],
  )

  const clearAllDrinkRecords = useCallback(async (): Promise<void> => {
    if (!userId) throw new Error('auth-required')
    await teaStashDb.clearDrinkRecordsForUser(userId)
    setRecords([])
    if (!isConfigured || !supabase) return
    try {
      const { error } = await supabase.from('drink_records').delete().eq('user_id', userId)
      if (error) throw new Error(error.message)
      setSyncStatus({ state: 'synced', lastSyncedAt: new Date().toISOString(), error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'
      setSyncStatus((prev) => ({ state: 'error', lastSyncedAt: prev.lastSyncedAt, error: message }))
    }
  }, [isConfigured, supabase, userId])

  const value = useMemo<DrinkDataContextValue>(
    () => ({
      records,
      isLoading,
      syncStatus,
      syncNow,
      addDrinkRecord,
      updateDrinkRecord,
      deleteDrinkRecord,
      clearAllDrinkRecords,
    }),
    [addDrinkRecord, clearAllDrinkRecords, deleteDrinkRecord, isLoading, records, syncNow, syncStatus, updateDrinkRecord],
  )

  return <DrinkDataContext.Provider value={value}>{children}</DrinkDataContext.Provider>
}

export function useDrinkData(): DrinkDataContextValue {
  const ctx = useContext(DrinkDataContext)
  if (!ctx) throw new Error('useDrinkData must be used within DrinkDataProvider')
  return ctx
}
