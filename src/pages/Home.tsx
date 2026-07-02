import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Leaf, AlertTriangle, TrendingDown, Clock } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useI18n } from '../i18n'
import { TeaCard } from '../components/TeaCard'
import { EmptyState } from '../components/EmptyState'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { isExpiringSoon, isLowRemaining, isExpired, getTeaStatus, pickUseFirstTeaId } from '../lib/teaLogic'
import { formatDateDisplay } from '../lib/date'

function SectionHeader({ icon: Icon, title, onViewAll }: { icon: typeof Clock; title: string; onViewAll?: () => void }) {
  const { t } = useI18n()
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
        <Icon size={17} className="text-matcha" />
        {title}
      </div>
      {onViewAll && (
        <button type="button" onClick={onViewAll} className="text-[13px] font-medium text-matcha">
          {t('home.viewAll')}
        </button>
      )}
    </div>
  )
}

export default function Home() {
  const { teas, usageRecords, isLoading } = useAppData()
  const { t, language } = useI18n()
  const navigate = useNavigate()

  const expiringSoon = useMemo(
    () =>
      teas
        .filter((tea) => isExpiringSoon(tea) || (getTeaStatus(tea) === 'active' && isExpired(tea.openedExpiryDate)))
        .slice(0, 3),
    [teas],
  )

  const lowRemaining = useMemo(() => teas.filter((tea) => isLowRemaining(tea)).slice(0, 3), [teas])

  const useFirstId = useMemo(() => pickUseFirstTeaId(teas), [teas])

  const teasById = useMemo(() => new Map(teas.map((tea) => [tea.id, tea])), [teas])

  const recentUsage = useMemo(
    () =>
      [...usageRecords]
        .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))
        .slice(0, 5),
    [usageRecords],
  )

  if (isLoading) return null

  return (
    <div className="pb-safe-nav">
      <header className="safe-top px-4 pt-5">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-matcha">{t('common.appName')}</p>
          <span className="rounded-pill bg-matcha/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-matcha">
            Beta
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <h1 className="text-[26px] font-bold text-ink">{t('home.title')}</h1>
          <button
            type="button"
            onClick={() => navigate('/inventory/new')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-matcha text-white shadow-soft active:scale-95"
            aria-label={t('inventory.addTea')}
          >
            <Plus size={22} />
          </button>
        </div>
        <p className="mt-0.5 text-[13.5px] text-ink/50">{t('home.subtitle')}</p>
      </header>

      {teas.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Leaf}
            title={t('home.emptyTitle')}
            subtitle={t('home.emptySubtitle')}
            action={
              <Button onClick={() => navigate('/inventory/new')}>
                <Plus size={18} /> {t('home.addFirstTea')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-5 space-y-6 px-4">
          {expiringSoon.length > 0 && (
            <section>
              <SectionHeader icon={AlertTriangle} title={t('home.expiringSoon')} onViewAll={() => navigate('/reminders')} />
              <div className="space-y-2">
                {expiringSoon.map((tea) => (
                  <TeaCard
                    key={tea.id}
                    tea={tea}
                    useFirst={tea.id === useFirstId}
                    onClick={() => navigate(`/inventory/${tea.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {lowRemaining.length > 0 && (
            <section>
              <SectionHeader icon={TrendingDown} title={t('home.lowRemaining')} onViewAll={() => navigate('/inventory')} />
              <div className="space-y-2">
                {lowRemaining.map((tea) => (
                  <TeaCard key={tea.id} tea={tea} onClick={() => navigate(`/inventory/${tea.id}`)} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHeader icon={Clock} title={t('home.recentUsage')} onViewAll={() => navigate('/history')} />
            {recentUsage.length === 0 ? (
              <Card className="p-4 text-[13.5px] text-ink/50">{t('history.noRecords')}</Card>
            ) : (
              <Card className="divide-y divide-ink/6 overflow-hidden">
                {recentUsage.map((record) => {
                  const tea = teasById.get(record.teaId)
                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => tea && navigate(`/inventory/${tea.id}`)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-cream/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-ink">{tea?.name ?? '—'}</p>
                        <p className="text-[12.5px] text-ink/45">
                          {formatDateDisplay(record.date, language)} · {record.time} · {t(`purpose.${record.purpose}` as never)}
                        </p>
                      </div>
                      <span className="shrink-0 text-[14px] font-semibold text-matcha">
                        -{record.gramsUsed}
                        {t('common.gramsShort')}
                      </span>
                    </button>
                  )
                })}
              </Card>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
