import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { TeaItem, UsageRecord } from '../types'

interface TeaStashDB extends DBSchema {
  teas: {
    key: string
    value: TeaItem
  }
  usageRecords: {
    key: string
    value: UsageRecord
    indexes: { 'by-teaId': string; 'by-date': string }
  }
}

const DB_NAME = 'teastash'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<TeaStashDB>> | null = null

function getDb(): Promise<IDBPDatabase<TeaStashDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TeaStashDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('teas')) {
          db.createObjectStore('teas', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('usageRecords')) {
          const store = db.createObjectStore('usageRecords', { keyPath: 'id' })
          store.createIndex('by-teaId', 'teaId')
          store.createIndex('by-date', 'date')
        }
      },
    })
  }
  return dbPromise
}

export const teaStashDb = {
  async getAllTeas(): Promise<TeaItem[]> {
    const db = await getDb()
    return db.getAll('teas')
  },
  async putTea(tea: TeaItem): Promise<void> {
    const db = await getDb()
    await db.put('teas', tea)
  },
  async deleteTea(id: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['teas', 'usageRecords'], 'readwrite')
    await tx.objectStore('teas').delete(id)
    const recordStore = tx.objectStore('usageRecords')
    const recordIndex = recordStore.index('by-teaId')
    let cursor = await recordIndex.openCursor(IDBKeyRange.only(id))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  },

  async getAllUsageRecords(): Promise<UsageRecord[]> {
    const db = await getDb()
    return db.getAll('usageRecords')
  },
  async putUsageRecord(record: UsageRecord): Promise<void> {
    const db = await getDb()
    await db.put('usageRecords', record)
  },
  async deleteUsageRecord(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('usageRecords', id)
  },

  async clearAll(): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['teas', 'usageRecords'], 'readwrite')
    await tx.objectStore('teas').clear()
    await tx.objectStore('usageRecords').clear()
    await tx.done
  },

  async replaceAll(teas: TeaItem[], usageRecords: UsageRecord[]): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['teas', 'usageRecords'], 'readwrite')
    const teaStore = tx.objectStore('teas')
    const recordStore = tx.objectStore('usageRecords')
    await teaStore.clear()
    await recordStore.clear()
    for (const tea of teas) await teaStore.put(tea)
    for (const record of usageRecords) await recordStore.put(record)
    await tx.done
  },
}
