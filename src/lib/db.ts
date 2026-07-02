import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { DrinkRecord, SyncTombstone, TeaItem, UsageRecord } from '../types'

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
  syncTombstones: {
    key: string
    value: SyncTombstone
  }
  drinkRecords: {
    key: string
    value: DrinkRecord
    indexes: { 'by-userId': string; 'by-user-date': [string, string] }
  }
}

const DB_NAME = 'teastash'
const DB_VERSION = 3

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
        if (!db.objectStoreNames.contains('syncTombstones')) {
          db.createObjectStore('syncTombstones', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('drinkRecords')) {
          const drinkStore = db.createObjectStore('drinkRecords', { keyPath: 'id' })
          drinkStore.createIndex('by-userId', 'userId')
          drinkStore.createIndex('by-user-date', ['userId', 'date'])
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

  async getAllSyncTombstones(): Promise<SyncTombstone[]> {
    const db = await getDb()
    return db.getAll('syncTombstones')
  },
  async putSyncTombstone(tombstone: SyncTombstone): Promise<void> {
    const db = await getDb()
    await db.put('syncTombstones', tombstone)
  },
  async putSyncTombstones(tombstones: SyncTombstone[]): Promise<void> {
    if (tombstones.length === 0) return
    const db = await getDb()
    const tx = db.transaction('syncTombstones', 'readwrite')
    for (const tombstone of tombstones) {
      await tx.store.put(tombstone)
    }
    await tx.done
  },
  async deleteSyncTombstones(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const db = await getDb()
    const tx = db.transaction('syncTombstones', 'readwrite')
    for (const id of ids) {
      await tx.store.delete(id)
    }
    await tx.done
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

  async getDrinkRecordsForUser(userId: string): Promise<DrinkRecord[]> {
    const db = await getDb()
    return db.getAllFromIndex('drinkRecords', 'by-userId', userId)
  },
  async putDrinkRecord(record: DrinkRecord): Promise<void> {
    const db = await getDb()
    await db.put('drinkRecords', record)
  },
  async putDrinkRecords(records: DrinkRecord[]): Promise<void> {
    if (records.length === 0) return
    const db = await getDb()
    const tx = db.transaction('drinkRecords', 'readwrite')
    for (const record of records) {
      await tx.store.put(record)
    }
    await tx.done
  },
  async deleteDrinkRecord(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('drinkRecords', id)
  },
  async replaceDrinkRecordsForUser(userId: string, records: DrinkRecord[]): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('drinkRecords', 'readwrite')
    const index = tx.store.index('by-userId')
    let cursor = await index.openCursor(IDBKeyRange.only(userId))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    for (const record of records) {
      await tx.store.put(record)
    }
    await tx.done
  },
  async clearDrinkRecordsForUser(userId: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('drinkRecords', 'readwrite')
    const index = tx.store.index('by-userId')
    let cursor = await index.openCursor(IDBKeyRange.only(userId))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  },
}
