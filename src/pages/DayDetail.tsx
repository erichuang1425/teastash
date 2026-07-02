import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CupSoda, Plus } from 'lucide-react'
import { useI18n } from '../i18n'
import { useDrinkData } from '../contexts/DrinkDataContext'
import { computeDrinkStats, formatSpend, recordsForDate } from '../lib/drinkLogic'
import { formatDateDisplay, todayISODate } from '../lib/date'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { TopBar } from '../components/TopBar'
import { DrinkRecordCard } from '../components/drink/DrinkRecordCard'

export default function DayDetail() {
  const { date } = useParams<{ date: string }>()
  const selectedDate = date ?? todayISODate()
  const { t, language } = useI18n()
  const { records, isLoading } = useDrinkData()
  const navigate = useNavigate()

  const dayRecords = useMemo(() => recordsForDate(records, selectedDate), [records, selectedDate])
  const stats = useMemo(() => computeDrinkStats(dayRecords), [dayRecords])
  const weekday = new Intl.DateTimeFormat(language === 'zh-TW' ? 'zh-TW' : 'en-US', { weekday: 'short' }).format(new Date(`${selectedDate}T12:00:00`))

  if (isLoading) {
    return <div className="px-5 py-12 text-center text-[15px] font-semibold text-ink/55">{t('common.loading')}</div>
  }

  return (
    <div className="pb-safe-nav">
      <TopBar title={formatDateDisplay(selectedDate, language)} showBack />
      <div className="space-y-5 px-5 pt-4">
        <div>
          <h1 className="text-[40px] font-black leading-none text-ink">
            {formatDateDisplay(selectedDate, language)}
          </h1>
          <p className="mt-2 text-[18px] font-bold text-ink/45">{weekday}</p>
        </div>

        <Card className="grid grid-cols-2 gap-y-5 p-5 text-center sm:grid-cols-4">
          <div>
            <p className="text-[34px] font-black text-roast">{stats.cups}</p>
            <p className="text-[13px] font-bold text-ink/48">{t('dayDetail.cups')}</p>
          </div>
          <div>
            <p className="text-[34px] font-black text-roast">{Math.round(stats.totalCaffeineMg)}</p>
            <p className="text-[13px] font-bold text-ink/48">{t('dayDetail.caffeine')}</p>
          </div>
          <div>
            <p className="text-[34px] font-black text-roast">{Math.round(stats.totalSugarG)}</p>
            <p className="text-[13px] font-bold text-ink/48">{t('dayDetail.sugar')}</p>
          </div>
          <div>
            <p className="text-[34px] font-black text-roast">{formatSpend(stats.totalSpend)}</p>
            <p className="text-[13px] font-bold text-ink/48">{t('dayDetail.spend')}</p>
          </div>
        </Card>

        <Button fullWidth className="min-h-[58px] text-[18px]" onClick={() => navigate(`/app/drinks/new?date=${selectedDate}`)}>
          <Plus size={22} /> {t('dashboard.addCup')}
        </Button>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[28px] font-black text-ink">{t('dayDetail.records')}</h2>
            <span className="text-[16px] font-black text-ink/28">{t('dayDetail.cupsCount', { count: dayRecords.length })}</span>
          </div>

          {dayRecords.length === 0 ? (
            <EmptyState
              icon={CupSoda}
              title={t('empty.noDrinks')}
              subtitle={t('empty.addFirstDrink')}
              action={<Button onClick={() => navigate(`/app/drinks/new?date=${selectedDate}`)}>{t('dashboard.addDrink')}</Button>}
            />
          ) : (
            <div className="space-y-3">
              {dayRecords.map((record) => (
                <DrinkRecordCard key={record.id} record={record} onClick={() => navigate(`/app/drinks/${record.id}/edit`)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
