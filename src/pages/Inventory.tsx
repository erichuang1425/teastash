import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Leaf } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useI18n } from '../i18n'
import { TeaCard } from '../components/TeaCard'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/Button'
import { getTeaStatus, openedExpiryDaysLeft, pickUseFirstTeaId, unopenedExpiryDaysLeft } from '../lib/teaLogic'
import type { TeaStatus } from '../types'

type SortKey = 'recent' | 'name' | 'remaining' | 'expiry'
type StatusFilter = 'all' | TeaStatus

const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'unopened', 'finished']

export default function Inventory() {
  const { teas, isLoading } = useAppData()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: teas.length, active: 0, unopened: 0, finished: 0 }
    for (const tea of teas) counts[getTeaStatus(tea)] += 1
    return counts
  }, [teas])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = teas.filter(
      (tea) =>
        (!q || tea.name.toLowerCase().includes(q) || tea.brand.toLowerCase().includes(q)) &&
        (statusFilter === 'all' || getTeaStatus(tea) === statusFilter),
    )
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'remaining':
          return a.remainingG - b.remainingG
        case 'expiry': {
          const da = openedExpiryDaysLeft(a) ?? unopenedExpiryDaysLeft(a) ?? Infinity
          const db = openedExpiryDaysLeft(b) ?? unopenedExpiryDaysLeft(b) ?? Infinity
          return da - db
        }
        default:
          return b.sortOrder - a.sortOrder || b.createdAt.localeCompare(a.createdAt)
      }
    })
    return list
  }, [teas, query, sortKey, statusFilter])

  const useFirstId = useMemo(() => pickUseFirstTeaId(teas), [teas])

  if (isLoading) return null

  return (
    <div className="pb-safe-nav">
      <header className="safe-top px-4 pt-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold text-ink">{t('inventory.title')}</h1>
          <button
            type="button"
            onClick={() => navigate('/inventory/new')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-matcha text-white shadow-soft active:scale-95"
            aria-label={t('inventory.addTea')}
          >
            <Plus size={22} />
          </button>
        </div>

        {teas.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('inventory.searchPlaceholder')}
                className="w-full min-h-[44px] rounded-pill border border-ink/12 bg-white pl-9 pr-3 text-[15px] text-ink placeholder:text-ink/35 focus:border-matcha focus:outline-none"
              />
            </div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="min-h-[44px] rounded-pill border border-ink/12 bg-white px-3 text-[14px] text-ink focus:border-matcha focus:outline-none"
            >
              <option value="recent">{t('inventory.sortRecent')}</option>
              <option value="name">{t('inventory.sortName')}</option>
              <option value="remaining">{t('inventory.sortRemaining')}</option>
              <option value="expiry">{t('inventory.sortExpiry')}</option>
            </select>
          </div>
        )}

        {teas.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((key) => {
              const active = statusFilter === key
              const label = key === 'all' ? t('inventory.filterAll') : t(`status.${key}` as never)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-pill px-3.5 text-[13px] font-semibold transition-colors ${
                    active ? 'bg-ink text-cream' : 'bg-white text-ink/55 border border-ink/10'
                  }`}
                >
                  {label}
                  <span className={active ? 'text-cream/70' : 'text-ink/35'}>{statusCounts[key]}</span>
                </button>
              )
            })}
          </div>
        )}
      </header>

      {teas.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Leaf}
            title={t('inventory.emptyTitle')}
            subtitle={t('inventory.emptySubtitle')}
            action={
              <Button onClick={() => navigate('/inventory/new')}>
                <Plus size={18} /> {t('inventory.addTea')}
              </Button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Leaf} title={t('inventory.noMatchTitle')} subtitle={t('inventory.noMatchSubtitle')} />
        </div>
      ) : (
        <div className="mt-4 space-y-2 px-4">
          {filtered.map((tea) => (
            <TeaCard
              key={tea.id}
              tea={tea}
              useFirst={tea.id === useFirstId}
              onClick={() => navigate(`/inventory/${tea.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
