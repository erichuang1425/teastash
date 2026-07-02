import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Leaf, CalendarArrowDown } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useToast } from '../contexts/ToastContext'
import { useI18n } from '../i18n'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { getTeaStatus, openedExpiryDaysLeft, unopenedExpiryDaysLeft } from '../lib/teaLogic'
import { buildExpiryIcs } from '../lib/ics'
import { triggerDownload } from '../lib/backup'
import type { TeaItem } from '../types'

function urgencyTextClass(days: number): string {
  if (days < 0) return 'text-red-600'
  if (days <= 7) return 'text-red-600'
  if (days <= 21) return 'text-amber-700'
  return 'text-ink/60'
}

function ReminderRow({ tea, days, onClick }: { tea: TeaItem; days: number; onClick: () => void }) {
  const { t } = useI18n()
  const label =
    days < 0 ? t('reminders.expiredDays', { days: Math.abs(days) }) : days === 0 ? t('reminders.dueToday') : t('reminders.daysLeft', { days })
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-cream/60">
      {tea.imageDataUrl ? (
        <img src={tea.imageDataUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tan/60 text-matcha">
          <Leaf size={18} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-ink">{tea.name}</p>
        <p className="truncate text-[12.5px] text-ink/45">{tea.brand}</p>
      </div>
      <span className={`shrink-0 text-[13.5px] font-semibold ${urgencyTextClass(days)}`}>{label}</span>
    </button>
  )
}

export default function Reminders() {
  const { teas } = useAppData()
  const { t } = useI18n()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const { expiringOpened, expiringUnopened, expired } = useMemo(() => {
    const openedList: { tea: TeaItem; days: number }[] = []
    const unopenedList: { tea: TeaItem; days: number }[] = []
    const expiredList: { tea: TeaItem; days: number }[] = []

    for (const tea of teas) {
      const status = getTeaStatus(tea)
      if (status === 'active') {
        const days = openedExpiryDaysLeft(tea)
        if (days === null) continue
        if (days < 0) expiredList.push({ tea, days })
        else openedList.push({ tea, days })
      } else if (status === 'unopened') {
        const days = unopenedExpiryDaysLeft(tea)
        if (days === null) continue
        if (days < 0) expiredList.push({ tea, days })
        else unopenedList.push({ tea, days })
      }
    }

    openedList.sort((a, b) => a.days - b.days)
    unopenedList.sort((a, b) => a.days - b.days)
    expiredList.sort((a, b) => a.days - b.days)

    return { expiringOpened: openedList, expiringUnopened: unopenedList, expired: expiredList }
  }, [teas])

  const hasAny = expiringOpened.length + expiringUnopened.length + expired.length > 0

  const handleExportIcs = () => {
    const ics = buildExpiryIcs(teas, t('common.appName'))
    triggerDownload(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'teastash-expiry-reminders.ics')
    showToast(t('toast.icsExported'))
  }

  return (
    <div className="pb-safe-nav">
      <header className="safe-top px-4 pt-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold text-ink">{t('reminders.title')}</h1>
          {hasAny && (
            <button
              type="button"
              onClick={handleExportIcs}
              className="flex min-h-[40px] items-center gap-1.5 rounded-pill border border-ink/12 bg-white px-3 text-[12.5px] font-medium text-ink"
            >
              <CalendarArrowDown size={15} /> {t('reminders.exportIcs')}
            </button>
          )}
        </div>
      </header>

      <div className="mt-4 space-y-6 px-4">
        {!hasAny ? (
          <EmptyState icon={Bell} title={t('reminders.empty')} subtitle={t('reminders.emptySubtitle')} />
        ) : (
          <>
            {expiringOpened.length > 0 && (
              <section>
                <h3 className="mb-2 px-1 text-[14px] font-semibold text-ink">{t('reminders.expiringSoonOpened')}</h3>
                <Card className="divide-y divide-ink/6 overflow-hidden">
                  {expiringOpened.map(({ tea, days }) => (
                    <ReminderRow key={tea.id} tea={tea} days={days} onClick={() => navigate(`/inventory/${tea.id}`)} />
                  ))}
                </Card>
              </section>
            )}

            {expiringUnopened.length > 0 && (
              <section>
                <h3 className="mb-2 px-1 text-[14px] font-semibold text-ink">{t('reminders.unopenedExpiry')}</h3>
                <Card className="divide-y divide-ink/6 overflow-hidden">
                  {expiringUnopened.map(({ tea, days }) => (
                    <ReminderRow key={tea.id} tea={tea} days={days} onClick={() => navigate(`/inventory/${tea.id}`)} />
                  ))}
                </Card>
              </section>
            )}

            {expired.length > 0 && (
              <section>
                <h3 className="mb-2 px-1 text-[14px] font-semibold text-ink">{t('reminders.expired')}</h3>
                <Card className="divide-y divide-ink/6 overflow-hidden">
                  {expired.map(({ tea, days }) => (
                    <ReminderRow key={tea.id} tea={tea} days={days} onClick={() => navigate(`/inventory/${tea.id}`)} />
                  ))}
                </Card>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
