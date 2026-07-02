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
import type { TeaItem, UsageRecord } from '../types'
import { teaStashDb } from '../lib/db'
import { createId } from '../lib/id'
import { nowISODateTime } from '../lib/date'
import { clampRemaining } from '../lib/teaLogic'
import { generateSampleData } from '../lib/sampleData'

const SEEDED_KEY = 'teastash.seeded'

export type TeaInput = Omit<TeaItem, 'id' | 'createdAt' | 'updatedAt'>
export type UsageInput = Pick<UsageRecord, 'teaId' | 'date' | 'time' | 'gramsUsed' | 'purpose' | 'notes'>

interface AppDataContextValue {
  teas: TeaItem[]
  usageRecords: UsageRecord[]
  isLoading: boolean
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
  const [teas, setTeas] = useState<TeaItem[]>([])
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Latest teas, readable from long-lived closures (e.g. undo toast actions)
  // without capturing a stale snapshot.
  const teasRef = useRef<TeaItem[]>([])
  teasRef.current = teas

  useEffect(() => {
    let cancelled = false
    async function boot() {
      let [loadedTeas, loadedRecords] = await Promise.all([
        teaStashDb.getAllTeas(),
        teaStashDb.getAllUsageRecords(),
      ])
      const alreadySeeded = localStorage.getItem(SEEDED_KEY) === 'true'
      if (loadedTeas.length === 0 && loadedRecords.length === 0 && !alreadySeeded) {
        const sample = generateSampleData()
        await teaStashDb.replaceAll(sample.teas, sample.usageRecords)
        loadedTeas = sample.teas
        loadedRecords = sample.usageRecords
        localStorage.setItem(SEEDED_KEY, 'true')
      }
      if (!cancelled) {
        setTeas(loadedTeas)
        setUsageRecords(loadedRecords)
        setIsLoading(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const addTea = useCallback(async (input: TeaInput): Promise<TeaItem> => {
    const now = nowISODateTime()
    const tea: TeaItem = { ...input, id: createId(), createdAt: now, updatedAt: now }
    await teaStashDb.putTea(tea)
    setTeas((prev) => [...prev, tea])
    return tea
  }, [])

  const updateTea = useCallback(
    async (id: string, input: TeaInput): Promise<void> => {
      const existing = teas.find((t) => t.id === id)
      if (!existing) return
      const merged: TeaItem = { ...existing, ...input, id, createdAt: existing.createdAt, updatedAt: nowISODateTime() }
      await teaStashDb.putTea(merged)
      setTeas((prev) => prev.map((t) => (t.id === id ? merged : t)))
    },
    [teas],
  )

  const deleteTea = useCallback(async (id: string): Promise<void> => {
    await teaStashDb.deleteTea(id)
    setTeas((prev) => prev.filter((t) => t.id !== id))
    setUsageRecords((prev) => prev.filter((r) => r.teaId !== id))
  }, [])

  const restoreTea = useCallback(async (tea: TeaItem, records: UsageRecord[]): Promise<void> => {
    await teaStashDb.putTea(tea)
    for (const record of records) {
      await teaStashDb.putUsageRecord(record)
    }
    setTeas((prev) => (prev.some((t) => t.id === tea.id) ? prev : [...prev, tea]))
    setUsageRecords((prev) => {
      const existing = new Set(prev.map((r) => r.id))
      return [...prev, ...records.filter((r) => !existing.has(r.id))]
    })
  }, [])

  const restoreUsageRecord = useCallback(async (record: UsageRecord): Promise<void> => {
    const tea = teasRef.current.find((t) => t.id === record.teaId)
    if (!tea) return
    const newRemaining = clampRemaining(tea.remainingG - record.gramsUsed, tea.netWeightG)
    const updatedTea: TeaItem = { ...tea, remainingG: newRemaining, updatedAt: nowISODateTime() }
    await teaStashDb.putUsageRecord(record)
    await teaStashDb.putTea(updatedTea)
    setUsageRecords((prev) => (prev.some((r) => r.id === record.id) ? prev : [...prev, record]))
    setTeas((prev) => prev.map((t) => (t.id === tea.id ? updatedTea : t)))
  }, [])

  const addUsageRecord = useCallback(
    async (input: UsageInput): Promise<UsageRecord> => {
      const tea = teas.find((t) => t.id === input.teaId)
      if (!tea) throw new Error('tea-not-found')
      const newRemaining = clampRemaining(tea.remainingG - input.gramsUsed, tea.netWeightG)
      const record: UsageRecord = {
        ...input,
        id: createId(),
        remainingAfter: newRemaining,
        createdAt: nowISODateTime(),
      }
      const updatedTea: TeaItem = { ...tea, remainingG: newRemaining, updatedAt: nowISODateTime() }
      await teaStashDb.putUsageRecord(record)
      await teaStashDb.putTea(updatedTea)
      setUsageRecords((prev) => [...prev, record])
      setTeas((prev) => prev.map((t) => (t.id === tea.id ? updatedTea : t)))
      return record
    },
    [teas],
  )

  const updateUsageRecord = useCallback(
    async (id: string, input: UsageInput): Promise<void> => {
      const oldRecord = usageRecords.find((r) => r.id === id)
      if (!oldRecord) throw new Error('record-not-found')

      const oldTea = teas.find((t) => t.id === oldRecord.teaId)
      const newTea = teas.find((t) => t.id === input.teaId)
      if (!newTea) throw new Error('tea-not-found')

      const teaUpdates = new Map<string, TeaItem>()

      if (oldTea) {
        const reverted = clampRemaining(oldTea.remainingG + oldRecord.gramsUsed, oldTea.netWeightG)
        teaUpdates.set(oldTea.id, { ...oldTea, remainingG: reverted, updatedAt: nowISODateTime() })
      }

      const baseNewTea = teaUpdates.get(newTea.id) ?? newTea
      const newRemaining = clampRemaining(baseNewTea.remainingG - input.gramsUsed, baseNewTea.netWeightG)
      const finalNewTea: TeaItem = { ...baseNewTea, remainingG: newRemaining, updatedAt: nowISODateTime() }
      teaUpdates.set(newTea.id, finalNewTea)

      const updatedRecord: UsageRecord = { ...oldRecord, ...input, remainingAfter: newRemaining }

      await teaStashDb.putUsageRecord(updatedRecord)
      for (const tea of teaUpdates.values()) {
        await teaStashDb.putTea(tea)
      }

      setUsageRecords((prev) => prev.map((r) => (r.id === id ? updatedRecord : r)))
      setTeas((prev) => prev.map((t) => teaUpdates.get(t.id) ?? t))
    },
    [teas, usageRecords],
  )

  const deleteUsageRecord = useCallback(
    async (id: string): Promise<void> => {
      const record = usageRecords.find((r) => r.id === id)
      if (!record) return
      const tea = teas.find((t) => t.id === record.teaId)
      await teaStashDb.deleteUsageRecord(id)
      setUsageRecords((prev) => prev.filter((r) => r.id !== id))
      if (tea) {
        const restored = clampRemaining(tea.remainingG + record.gramsUsed, tea.netWeightG)
        const updatedTea: TeaItem = { ...tea, remainingG: restored, updatedAt: nowISODateTime() }
        await teaStashDb.putTea(updatedTea)
        setTeas((prev) => prev.map((t) => (t.id === tea.id ? updatedTea : t)))
      }
    },
    [teas, usageRecords],
  )

  const importBackup = useCallback(async (newTeas: TeaItem[], newRecords: UsageRecord[]): Promise<void> => {
    await teaStashDb.replaceAll(newTeas, newRecords)
    localStorage.setItem(SEEDED_KEY, 'true')
    setTeas(newTeas)
    setUsageRecords(newRecords)
  }, [])

  const resetToSampleData = useCallback(async (): Promise<void> => {
    const sample = generateSampleData()
    await teaStashDb.replaceAll(sample.teas, sample.usageRecords)
    localStorage.setItem(SEEDED_KEY, 'true')
    setTeas(sample.teas)
    setUsageRecords(sample.usageRecords)
  }, [])

  const clearAllData = useCallback(async (): Promise<void> => {
    await teaStashDb.clearAll()
    localStorage.setItem(SEEDED_KEY, 'true')
    setTeas([])
    setUsageRecords([])
  }, [])

  const value = useMemo<AppDataContextValue>(
    () => ({
      teas,
      usageRecords,
      isLoading,
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
