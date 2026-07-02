import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, CupSoda, Plus } from 'lucide-react'
import { useI18n } from '../i18n'
import { useDrinkData } from '../contexts/DrinkDataContext'
import { buildMonthGrid, addMonths, recordsForDate } from '../lib/drinkLogic'
import { formatMonthLabel, todayISODate } from '../lib/date'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { DrinkAvatar } from '../components/drink/DrinkAvatar'
import { DrinkRecordCard } from '../components/drink/DrinkRecordCard'

const CAFFEINE_LIMIT_MG = 400

export default function TrackerDashboard() {
  const { t, language } = useI18n()
  const { records, isLoading } = useDrinkData()
  const navigate = useNavigate()
  const [monthAnchor, setMonthAnchor] = useState(() => `${todayISODate().slice(0, 7)}-01`)
  const today = todayISODate()

  const grid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor])
  const recordsByDate = useMemo(() => {
    const groups = new Map<string, typeof records>()
    for (const record of records) {
      const group = groups.get(record.date) ?? []
      group.push(record)
      groups.set(record.date, group)
    }
    return groups
  }, [records])

  const todayRecords = useMemo(() => recordsForDate(records, today), [records, today])
  const todayCaffeine = todayRecords.reduce((sum, record) => sum + record.caffeineMg, 0)
  const caffeineRatio = Math.min(1, todayCaffeine / CAFFEINE_LIMIT_MG)

  if (isLoading) {
    return <div className="px-5 py-12 text-center text-[15px] font-semibold text-ink/55">{t('common.loading')}</div>
  }

  return (
    <div className="pb-safe-nav">
      <header className="safe-top px-5 pt-5">
        <p className="text-[13px] font-black uppercase tracking-[0.16em] text-roast/65">{t('dashboard.kicker')}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[42px] font-black leading-none text-ink">
              {formatMonthLabel(monthAnchor.slice(0, 7), language)}
            </h1>
            <p className="mt-2 text-[15px] font-semibold text-ink/45">{t('dashboard.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/app/drinks/new?date=${today}`)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-roast text-white shadow-card transition active:scale-95"
            aria-label={t('addDrink.titleAdd')}
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      <div className="mt-6 space-y-6 px-5">
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-roast" />
              <p className="text-[15px] font-black text-ink">{t('dashboard.calendar')}</p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setMonthAnchor((value) => addMonths(value, -1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink/65"
                aria-label={t('dashboard.previousMonth')}
              >
                <ChevronLeft size={19} />
              </button>
              <button
                type="button"
                onClick={() => setMonthAnchor((value) => addMonths(value, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink/65"
                aria-label={t('dashboard.nextMonth')}
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {['mondayShort', 'tuesdayShort', 'wednesdayShort', 'thursdayShort', 'fridayShort', 'saturdayShort', 'sundayShort'].map((key) => (
              <div key={key} className="text-[12px] font-black uppercase text-ink/38">
                {t(`calendar.${key}` as never)}
              </div>
            ))}
            {grid.map((day) => {
              const dayRecords = recordsByDate.get(day.date) ?? []
              const first = dayRecords[0]
              return (
                <button
                  type="button"
                  key={day.key}
                  onClick={() => navigate(`/app/day/${day.date}`)}
                  className={`relative aspect-square rounded-[18px] text-[14px] font-black transition active:scale-95 ${
                    day.isToday ? 'bg-roast text-white' : dayRecords.length > 0 ? 'bg-tan/80 text-ink' : 'bg-cream/70 text-ink/45'
                  } ${day.inMonth ? '' : 'opacity-35'}`}
                  aria-label={t('dashboard.openDay', { date: day.date })}
                >
                  {dayRecords.length === 0 ? (
                    day.dayNumber
                  ) : dayRecords.length === 1 && first ? (
                    <div className="absolute inset-1 flex items-center justify-center">
                      <DrinkAvatar record={first} className="h-full w-full" iconSize={19} />
                    </div>
                  ) : (
                    <span>{dayRecords.length}</span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <Button fullWidth className="min-h-[58px] text-[18px]" onClick={() => navigate(`/app/drinks/new?date=${today}`)}>
          <Plus size={22} /> {t('dashboard.addCup')}
        </Button>

        <section>
          <h2 className="mb-3 text-[26px] font-black text-ink">{t('dashboard.todayDrinks')}</h2>
          <Card className="p-5">
            <p className="text-[15px] font-bold text-ink/55">{t('dashboard.todayCaffeine')}</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-cream">
              <div className="h-full rounded-full bg-roast transition-all" style={{ width: `${caffeineRatio * 100}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-[17px] font-black text-ink/48">
              <span>{Math.round(todayCaffeine)} mg</span>
              <span>{CAFFEINE_LIMIT_MG} mg</span>
            </div>
          </Card>
        </section>

        <section>
          {todayRecords.length === 0 ? (
            <EmptyState
              icon={CupSoda}
              title={t('empty.noDrinks')}
              subtitle={t('empty.addFirstDrink')}
              action={<Button onClick={() => navigate(`/app/drinks/new?date=${today}`)}>{t('dashboard.addDrink')}</Button>}
            />
          ) : (
            <div className="space-y-3">
              {todayRecords.map((record) => (
                <DrinkRecordCard key={record.id} record={record} onClick={() => navigate(`/app/drinks/${record.id}/edit`)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
