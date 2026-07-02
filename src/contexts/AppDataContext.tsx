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
import type { SyncStatus, SyncTombstone, TeaItem, UsageRecord } from '../types'
import { teaStashDb } from '../lib/db'
import { createId } from '../lib/id'
import { nowISODateTime } from '../lib/date'
import { clampRemaining } from '../lib/teaLogic'
import { generateSampleData } from '../lib/sampleData'
import { useSupabaseAuth } from './SupabaseAuthContext'
import { createSyncTombstone, mergeTombstones, normalizeUsageRecord, syncTeaStash } from '../lib/sync'

const SEEDED_KEY = 'teastash.seeded'
const INITIAL_SYNC_STATUS: SyncStatus = { state: 'disabled', lastSyncedAt: null, error: null }

export type TeaInput = Omit<TeaItem, 'id' | 'createdAt' | 'updatedAt'>
export type UsageInput = Pick<UsageRecord, 'teaId' | 'date' | 'time' | 'gramsUsed' | 'purpose' | 'notes'>

interface AppDataContextValue {
  teas: TeaItem[]
  usageRecords: UsageRecord[]
  isLoading: boolean
  syncStatus: SyncStatus
  syncNow: () => Promise<void>
  addTea: (input: TeaInput) => Promise<TeaItem>
  updateTea: (id: string, input: TeaInput) => Promise<void>
  deleteTea: (id: string) => Promise<void>
  restoreTea: (tea: TeaItem, records: UsageRecord[]) => Promise<void>
  restoreUsageRecord: (record: UsageRecord) => Promise<void>
  addUsageRecord: (input: UsageInput) => Promise<UsageRecord>
  updateUsageRecord: (id: string, input: UsageInput) => Promise<void>
  deleteUsageRecord: (id: string) => Promise<void>
  importBackup: (teas: TeaItem[], usageRecords: UsageRecord[]) => Promise<void>
  resetToSampleData: () => Promise<void>
  clearAllData: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { client: supabase, isConfigured: isSupabaseConfigured, user } = useSupabaseAuth()
  const userId = user?.id ?? null
  const [teas, setTeas] = useState<TeaItem[]>([])
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [syncTombstones, setSyncTombstones] = useState<SyncTombstone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(INITIAL_SYNC_STATUS)

  // Latest teas, readable from long-lived closures (e.g. undo toast actions)
  // without capturing a stale snapshot.
  const teasRef = useRef<TeaItem[]>([])
  teasRef.current = teas
  const usageRecordsRef = useRef<UsageRecord[]>([])
  usageRecordsRef.current = usageRecords
  const syncTombstonesRef = useRef<SyncTombstone[]>([])
  syncTombstonesRef.current = syncTombstones
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncInFlightRef = useRef(false)
  const syncQueuedRef = useRef(false)
  const localRevisionRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      let [loadedTeas, loadedRecords, loadedTombstones] = await Promise.all([
        teaStashDb.getAllTeas(),
        teaStashDb.getAllUsageRecords(),
        teaStashDb.getAllSyncTombstones(),
      ])
      const alreadySeeded = localStorage.getItem(SEEDED_KEY) === 'true'
      if (loadedTeas.length === 0 && loadedRecords.length === 0 && !alreadySeeded) {
        const sample = generateSampleData()
        await teaStashDb.replaceAll(sample.teas, sample.usageRecords)
        loadedTeas = sample.teas
        loadedRecords = sample.usageRecords
        localStorage.setItem(SEEDED_KEY, 'true')
      }
      const normalizedRecords = loadedRecords.map(normalizeUsageRecord)
      if (normalizedRecords.some((record, index) => record.updatedAt !== loadedRecords[index]?.updatedAt)) {
        await Promise.all(normalizedRecords.map((record) => teaStashDb.putUsageRecord(record)))
        loadedRecords = normalizedRecords
      }
      if (!cancelled) {
        setTeas(loadedTeas)
        setUsageRecords(loadedRecords)
        setSyncTombstones(loadedTombstones)
        setIsLoading(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const syncNow = useCallback(async (): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus({ state: 'disabled', lastSyncedAt: null, error: null })
      return
    }
    if (!userId) {
      setSyncStatus((prev) => ({ state: 'signedOut', lastSyncedAt: prev.lastSyncedAt, error: null }))
      return
    }
    if (isLoading) return
    if (syncInFlightRef.current) {
      syncQueuedRef.current = true
      return
    }

    syncInFlightRef.current = true
    try {
      do {
        syncQueuedRef.current = false
        setSyncStatus((prev) => ({ ...prev, state: 'syncing', error: null }))
        const startRevision = localRevisionRef.current
        const result = await syncTeaStash({
          supabase,
          userId,
          teas: teasRef.current,
          usageRecords: usageRecordsRef.current,
          tombstones: syncTombstonesRef.current,
        })
        if (startRevision !== localRevisionRef.current) {
          syncQueuedRef.current = true
          continue
        }
        await teaStashDb.replaceAll(result.teas, result.usageRecords)
        await teaStashDb.deleteSyncTombstones(result.tombstoneIdsToRemove)
        const removeIds = new Set(result.tombstoneIdsToRemove)
        setTeas(result.teas)
        setUsageRecords(result.usageRecords)
        setSyncTombstones((prev) => prev.filter((tombstone) => !removeIds.has(tombstone.id)))
        setSyncStatus({ state: 'synced', lastSyncedAt: result.syncedAt, error: null })
      } while (syncQueuedRef.current)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'
      setSyncStatus((prev) => ({ state: 'error', lastSyncedAt: prev.lastSyncedAt, error: message }))
    } finally {
      syncInFlightRef.current = false
    }
  }, [isLoading, isSupabaseConfigured, supabase, userId])

  const scheduleSync = useCallback(
    (delayMs = 1200): void => {
      if (!isSupabaseConfigured || !supabase || !userId || isLoading) return
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      syncTimerRef.current = setTimeout(() => {
        syncTimerRef.current = null
        void syncNow()
      }, delayMs)
    },
    [isLoading, isSupabaseConfigured, supabase, syncNow, userId],
  )

  useEffect(() => {
    if (isLoading) return
    if (!isSupabaseConfigured) {
      setSyncStatus({ state: 'disabled', lastSyncedAt: null, error: null })
      return
    }
    if (!userId) {
      setSyncStatus((prev) => ({ state: 'signedOut', lastSyncedAt: prev.lastSyncedAt, error: null }))
      return
    }
    scheduleSync(0)
  }, [isLoading, isSupabaseConfigured, scheduleSync, userId])

  useEffect(
    () => () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    },
    [],
  )

  const addSyncTombstones = useCallback(async (tombstones: SyncTombstone[]): Promise<void> => {
    if (tombstones.length === 0) return
    await teaStashDb.putSyncTombstones(tombstones)
    setSyncTombstones((prev) => mergeTombstones(prev, tombstones))
  }, [])

  const removeSyncTombstones = useCallback(async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return
    await teaStashDb.deleteSyncTombstones(ids)
    const removeIds = new Set(ids)
    setSyncTombstones((prev) => prev.filter((tombstone) => !removeIds.has(tombstone.id)))
  }, [])

  const markLocalChange = useCallback(() => {
    localRevisionRef.current += 1
  }, [])

  const tombstonesForData = useCallback(
    (teaList: TeaItem[], recordList: UsageRecord[], updatedAt: string): SyncTombstone[] => [
      ...teaList.map((tea) => createSyncTombstone('tea', tea.id, updatedAt)),
      ...recordList.map((record) => createSyncTombstone('usage_record', record.id, updatedAt)),
    ],
    [],
  )

  const addTea = useCallback(async (input: TeaInput): Promise<TeaItem> => {
    const now = nowISODateTime()
    const tea: TeaItem = { ...input, id: createId(), createdAt: now, updatedAt: now }
    await teaStashDb.putTea(tea)
    markLocalChange()
    setTeas((prev) => [...prev, tea])
    scheduleSync()
    return tea
  }, [markLocalChange, scheduleSync])

  const updateTea = useCallback(
    async (id: string, input: TeaInput): Promise<void> => {
      const existing = teas.find((t) => t.id === id)
      if (!existing) return
      const merged: TeaItem = { ...existing, ...input, id, createdAt: existing.createdAt, updatedAt: nowISODateTime() }
      await teaStashDb.putTea(merged)
      markLocalChange()
      setTeas((prev) => prev.map((t) => (t.id === id ? merged : t)))
      scheduleSync()
    },
    [markLocalChange, scheduleSync, teas],
  )

  const deleteTea = useCallback(
    async (id: string): Promise<void> => {
      const deletedAt = nowISODateTime()
      const relatedRecords = usageRecordsRef.current.filter((r) => r.teaId === id)
      await addSyncTombstones([
        createSyncTombstone('tea', id, deletedAt),
        ...relatedRecords.map((record) => createSyncTombstone('usage_record', record.id, deletedAt)),
      ])
      await teaStashDb.deleteTea(id)
      markLocalChange()
      setTeas((prev) => prev.filter((t) => t.id !== id))
      setUsageRecords((prev) => prev.filter((r) => r.teaId !== id))
      scheduleSync()
    },
    [addSyncTombstones, markLocalChange, scheduleSync],
  )

  const restoreTea = useCallback(
    async (tea: TeaItem, records: UsageRecord[]): Promise<void> => {
      const restoredAt = nowISODateTime()
      const restoredTea: TeaItem = { ...tea, updatedAt: restoredAt }
      const restoredRecords = records.map((record) => normalizeUsageRecord({ ...record, updatedAt: restoredAt }))
      await removeSyncTombstones([
        createSyncTombstone('tea', tea.id, restoredAt).id,
        ...records.map((record) => createSyncTombstone('usage_record', record.id, restoredAt).id),
      ])
      await teaStashDb.putTea(restoredTea)
      for (const record of restoredRecords) {
        await teaStashDb.putUsageRecord(record)
      }
      markLocalChange()
      setTeas((prev) =>
        prev.some((t) => t.id === restoredTea.id)
          ? prev.map((t) => (t.id === restoredTea.id ? restoredTea : t))
          : [...prev, restoredTea],
      )
      setUsageRecords((prev) => {
        const restoredById = new Map(restoredRecords.map((record) => [record.id, record]))
        const merged = prev.map((record) => restoredById.get(record.id) ?? record)
        const existing = new Set(merged.map((r) => r.id))
        return [...merged, ...restoredRecords.filter((r) => !existing.has(r.id))]
      })
      scheduleSync()
    },
    [markLocalChange, removeSyncTombstones, scheduleSync],
  )

  const restoreUsageRecord = useCallback(
    async (record: UsageRecord): Promise<void> => {
      const tea = teasRef.current.find((t) => t.id === record.teaId)
      if (!tea) return
      const restoredAt = nowISODateTime()
      const restoredRecord = normalizeUsageRecord({ ...record, updatedAt: restoredAt })
      const newRemaining = clampRemaining(tea.remainingG - restoredRecord.gramsUsed, tea.netWeightG)
      const updatedTea: TeaItem = { ...tea, remainingG: newRemaining, updatedAt: restoredAt }
      await removeSyncTombstones([createSyncTombstone('usage_record', restoredRecord.id, restoredAt).id])
      await teaStashDb.putUsageRecord(restoredRecord)
      await teaStashDb.putTea(updatedTea)
      markLocalChange()
      setUsageRecords((prev) => (prev.some((r) => r.id === restoredRecord.id) ? prev : [...prev, restoredRecord]))
      setTeas((prev) => prev.map((t) => (t.id === tea.id ? updatedTea : t)))
      scheduleSync()
    },
    [markLocalChange, removeSyncTombstones, scheduleSync],
  )

  const addUsageRecord = useCallback(
    async (input: UsageInput): Promise<UsageRecord> => {
      const tea = teas.find((t) => t.id === input.teaId)
      if (!tea) throw new Error('tea-not-found')
      const now = nowISODateTime()
      const newRemaining = clampRemaining(tea.remainingG - input.gramsUsed, tea.netWeightG)
      const record: UsageRecord = {
        ...input,
        id: createId(),
        remainingAfter: newRemaining,
        createdAt: now,
        updatedAt: now,
      }
      const updatedTea: TeaItem = { ...tea, remainingG: newRemaining, updatedAt: now }
      await teaStashDb.putUsageRecord(record)
      await teaStashDb.putTea(updatedTea)
      markLocalChange()
      setUsageRecords((prev) => [...prev, record])
      setTeas((prev) => prev.map((t) => (t.id === tea.id ? updatedTea : t)))
      scheduleSync()
      return record
    },
    [markLocalChange, scheduleSync, teas],
  )

  const updateUsageRecord = useCallback(
    async (id: string, input: UsageInput): Promise<void> => {
      const oldRecord = usageRecords.find((r) => r.id === id)
      if (!oldRecord) throw new Error('record-not-found')

      const oldTea = teas.find((t) => t.id === oldRecord.teaId)
      const newTea = teas.find((t) => t.id === input.teaId)
      if (!newTea) throw new Error('tea-not-found')

      const teaUpdates = new Map<string, TeaItem>()

      const updatedAt = nowISODateTime()

      if (oldTea) {
        const reverted = clampRemaining(oldTea.remainingG + oldRecord.gramsUsed, oldTea.netWeightG)
        teaUpdates.set(oldTea.id, { ...oldTea, remainingG: reverted, updatedAt })
      }

      const baseNewTea = teaUpdates.get(newTea.id) ?? newTea
      const newRemaining = clampRemaining(baseNewTea.remainingG - input.gramsUsed, baseNewTea.netWeightG)
      const finalNewTea: TeaItem = { ...baseNewTea, remainingG: newRemaining, updatedAt }
      teaUpdates.set(newTea.id, finalNewTea)

      const updatedRecord: UsageRecord = { ...oldRecord, ...input, remainingAfter: newRemaining, updatedAt }

      await teaStashDb.putUsageRecord(updatedRecord)
      for (const tea of teaUpdates.values()) {
        await teaStashDb.putTea(tea)
      }

      markLocalChange()
      setUsageRecords((prev) => prev.map((r) => (r.id === id ? updatedRecord : r)))
      setTeas((prev) => prev.map((t) => teaUpdates.get(t.id) ?? t))
      scheduleSync()
    },
    [markLocalChange, scheduleSync, teas, usageRecords],
  )

  const deleteUsageRecord = useCallback(
    async (id: string): Promise<void> => {
      const record = usageRecords.find((r) => r.id === id)
      if (!record) return
      const tea = teas.find((t) => t.id === record.teaId)
      const deletedAt = nowISODateTime()
      await addSyncTombstones([createSyncTombstone('usage_record', id, deletedAt)])
      await teaStashDb.deleteUsageRecord(id)
      markLocalChange()
      setUsageRecords((prev) => prev.filter((r) => r.id !== id))
      if (tea) {
        const restored = clampRemaining(tea.remainingG + record.gramsUsed, tea.netWeightG)
        const updatedTea: TeaItem = { ...tea, remainingG: restored, updatedAt: deletedAt }
        await teaStashDb.putTea(updatedTea)
        setTeas((prev) => prev.map((t) => (t.id === tea.id ? updatedTea : t)))
      }
      scheduleSync()
    },
    [addSyncTombstones, markLocalChange, scheduleSync, teas, usageRecords],
  )

  const importBackup = useCallback(
    async (newTeas: TeaItem[], newRecords: UsageRecord[]): Promise<void> => {
      const importedRecords = newRecords.map(normalizeUsageRecord)
      const newTeaIds = new Set(newTeas.map((tea) => tea.id))
      const newRecordIds = new Set(importedRecords.map((record) => record.id))
      const deletedAt = nowISODateTime()
      await addSyncTombstones(
        tombstonesForData(
          teasRef.current.filter((tea) => !newTeaIds.has(tea.id)),
          usageRecordsRef.current.filter((record) => !newRecordIds.has(record.id)),
          deletedAt,
        ),
      )
      await teaStashDb.replaceAll(newTeas, importedRecords)
      localStorage.setItem(SEEDED_KEY, 'true')
      markLocalChange()
      setTeas(newTeas)
      setUsageRecords(importedRecords)
      scheduleSync()
    },
    [addSyncTombstones, markLocalChange, scheduleSync, tombstonesForData],
  )

  const resetToSampleData = useCallback(async (): Promise<void> => {
    const deletedAt = nowISODateTime()
    const sample = generateSampleData()
    await addSyncTombstones(tombstonesForData(teasRef.current, usageRecordsRef.current, deletedAt))
    await teaStashDb.replaceAll(sample.teas, sample.usageRecords)
    localStorage.setItem(SEEDED_KEY, 'true')
    markLocalChange()
    setTeas(sample.teas)
    setUsageRecords(sample.usageRecords)
    scheduleSync()
  }, [addSyncTombstones, markLocalChange, scheduleSync, tombstonesForData])

  const clearAllData = useCallback(async (): Promise<void> => {
    const deletedAt = nowISODateTime()
    await addSyncTombstones(tombstonesForData(teasRef.current, usageRecordsRef.current, deletedAt))
    await teaStashDb.clearAll()
    localStorage.setItem(SEEDED_KEY, 'true')
    markLocalChange()
    setTeas([])
    setUsageRecords([])
    scheduleSync()
  }, [addSyncTombstones, markLocalChange, scheduleSync, tombstonesForData])

  const value = useMemo<AppDataContextValue>(
    () => ({
      teas,
      usageRecords,
      isLoading,
      syncStatus,
      syncNow,
      addTea,
      updateTea,
      deleteTea,
      restoreTea,
      restoreUsageRecord,
      addUsageRecord,
      updateUsageRecord,
      deleteUsageRecord,
      importBackup,
      resetToSampleData,
      clearAllData,
    }),
    [
      teas,
      usageRecords,
      isLoading,
      syncStatus,
      syncNow,
      addTea,
      updateTea,
      deleteTea,
      restoreTea,
      restoreUsageRecord,
      addUsageRecord,
      updateUsageRecord,
      deleteUsageRecord,
      importBackup,
      resetToSampleData,
      clearAllData,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
