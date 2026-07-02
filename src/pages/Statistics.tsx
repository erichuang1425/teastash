import { useMemo, useState } from 'react'
import { CupSoda } from 'lucide-react'
import { useI18n } from '../i18n'
import { useDrinkData } from '../contexts/DrinkDataContext'
import { computeDrinkStats, formatSpend, recordsForPeriod, type StatsPeriod } from '../lib/drinkLogic'
import { EmptyState } from '../components/EmptyState'
import { Card } from '../components/Card'
import { DrinkClusterAnimation } from '../components/drink/DrinkClusterAnimation'

const periods: StatsPeriod[] = ['week', 'month', 'year']

function StatTile({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <Card className="p-5">
      <p className="text-[15px] font-black text-ink/46">{label}</p>
      <p className="mt-3 text-[42px] font-black leading-none text-roast">
        {value}
        {unit && <span className="ml-1 text-[18px] font-black text-ink/48">{unit}</span>}
      </p>
    </Card>
  )
}

export default function Statistics() {
  const { t } = useI18n()
  const { records, isLoading } = useDrinkData()
  const [period, setPeriod] = useState<StatsPeriod>('month')

  const filteredRecords = useMemo(() => recordsForPeriod(records, period), [period, records])
  const stats = useMemo(() => computeDrinkStats(filteredRecords), [filteredRecords])
  const mostPopular = stats.mostPopularType ? t(`drinkType.${stats.mostPopularType}` as never) : t('empty.noDrinksShort')

  if (isLoading) {
    return <div className="px-5 py-12 text-center text-[15px] font-semibold text-ink/55">{t('common.loading')}</div>
  }

  return (
    <div className="pb-safe-nav">
      <header className="safe-top px-5 pt-5">
        <h1 className="text-[42px] font-black leading-none text-ink">{t('statistics.title')}</h1>
        <p className="mt-2 text-[15px] font-semibold text-ink/45">{t('statistics.subtitle')}</p>
      </header>

      <div className="mt-6 space-y-5 px-5">
        <div className="grid grid-cols-3 gap-2 rounded-full bg-white p-1 shadow-soft">
          {periods.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`min-h-[44px] rounded-full text-[15px] font-black transition ${
                period === item ? 'bg-roast text-white shadow-soft' : 'text-ink/55'
              }`}
            >
              {t(`statistics.${item}` as never)}
            </button>
          ))}
        </div>

        <DrinkClusterAnimation records={filteredRecords} animationKey={period} />

        {records.length === 0 ? (
          <EmptyState icon={CupSoda} title={t('empty.noDrinks')} subtitle={t('empty.statsLater')} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label={t('statistics.totalCups')} value={stats.cups} />
              <StatTile label={t('statistics.totalSpend')} value={formatSpend(stats.totalSpend)} />
              <StatTile label={t('statistics.totalCaffeine')} value={Math.round(stats.totalCaffeineMg)} unit="mg" />
              <StatTile label={t('statistics.monthlyAvg')} value={Math.round(stats.monthlyAverageMg)} unit="mg" />
            </div>

            <Card className="p-5">
              <p className="text-[15px] font-black text-ink/46">{t('statistics.mostPopular')}</p>
              <p className="mt-3 text-[28px] font-black text-ink">{mostPopular}</p>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
