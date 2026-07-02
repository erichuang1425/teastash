export type TeaType =
  | 'matcha'
  | 'sencha'
  | 'genmaicha'
  | 'houjicha'
  | 'oolong'
  | 'blackTea'
  | 'puerh'
  | 'other'

export type UsagePurpose = 'usucha' | 'koicha' | 'latte' | 'dessert' | 'other'

export type DrinkType =
  | 'tea'
  | 'greenTea'
  | 'oolongTea'
  | 'blackTea'
  | 'milkTea'
  | 'powderedTea'
  | 'coffee'
  | 'espresso'
  | 'latte'
  | 'homemade'
  | 'energyDrink'
  | 'other'

export type DrinkSize = 'small' | 'medium' | 'large' | 'custom'

export interface DrinkRecord {
  id: string
  userId: string
  date: string // yyyy-mm-dd
  time: string // HH:mm
  name: string
  drinkType: DrinkType
  size: DrinkSize
  caffeineMg: number
  spendAmount: number
  sugarG: number
  homemade: boolean
  brewingDetails: string
  notes: string
  imageDataUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface TeaItem {
  id: string
  name: string
  brand: string
  teaType: TeaType
  netWeightG: number
  remainingG: number
  purchaseDate: string | null
  openedDate: string | null
  unopenedExpiryDate: string | null
  openedExpiryDate: string | null
  storageLocation: string
  notes: string
  imageDataUrl: string | null
  tinColor: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface UsageRecord {
  id: string
  teaId: string
  date: string // yyyy-mm-dd
  time: string // HH:mm
  gramsUsed: number
  purpose: UsagePurpose
  notes: string
  remainingAfter: number
  createdAt: string
  updatedAt: string
}

export type SyncEntity = 'tea' | 'usage_record'

export interface SyncTombstone {
  id: string
  entity: SyncEntity
  itemId: string
  updatedAt: string
}

export type SyncState = 'disabled' | 'signedOut' | 'idle' | 'syncing' | 'synced' | 'error'

export interface SyncStatus {
  state: SyncState
  lastSyncedAt: string | null
  error: string | null
}

export type TeaStatus = 'unopened' | 'active' | 'finished'

export interface AppSettings {
  language: 'en' | 'zh-TW'
  hasCompletedOnboarding: boolean
}

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  app: 'teastash'
  teas: TeaItem[]
  usageRecords: UsageRecord[]
}
