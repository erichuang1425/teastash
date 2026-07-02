import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Clock } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useI18n } from '../i18n'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { BarChart } from '../components/BarChart'
import { formatDateDisplay, formatMonthLabel, monthKeyOf } from '../lib/date'
import { usageRecordsToCsv } from '../lib/csv'
import { downloadJson, triggerDownload } from '../lib/backup'

export default function History() {
  const { teas, usageRecords, isLoading } = useAppData()
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const [teaFilter, setTeaFilter] = useState<string>('all')

  const teasById = useMemo(() => new Map(teas.map((tea) => [tea.id, tea])), [teas])

  const filtered = useMemo(
    () => (teaFilter === 'all' ? usageRecords : usageRecords.filter((r) => r.teaId === teaFilter)),
    [usageRecords, teaFilter],
  )

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)),
    [filtered],
  )

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, r) => sum + r.gramsUsed, 0)
    const count = filtered.length
    return { total, count, avg: count > 0 ? total / count : 0 }
  }, [filtered])

  const purposeData = useMemo(() => {
    const byPurpose = new Map<string, number>()
    for (const r of filtered) {
      byPurpose.set(r.purpose, (byPurpose.get(r.purpose) ?? 0) + r.gramsUsed)
    }
    const total = [...byPurpose.values()].reduce((a, b) => a + b, 0)
    return [...byPurpose.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([purpose, grams]) => ({
        purpose,
        grams: Math.round(grams * 10) / 10,
        ratio: total > 0 ? grams / total : 0,
      }))
  }, [filtered])

  const monthlyData = useMemo(() => {
    const byMonth = new Map<string, number>()
    for (const r of filtered) {
      byMonth.set(monthKeyOf(r.date), (byMonth.get(monthKeyOf(r.date)) ?? 0) + r.gramsUsed)
    }
    const months: string[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return months.map((key) => ({ label: formatMonthLabel(key, language), value: Math.round((byMonth.get(key) ?? 0) * 10) / 10 }))
  }, [filtered, language])

  const grouped = useMemo(() => {
    const groups: { date: string; records: typeof sorted }[] = []
    for (const record of sorted) {
      const last = groups[groups.length - 1]
      if (last && last.date === record.date) {
        last.records.push(record)
      } else {
        groups.push({ date: record.date, records: [record] })
      }
    }
    return groups
  }, [sorted])

  const handleExportCsv = () => {
    const csv = usageRecordsToCsv(sorted, teasById)
    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `teastash-usage-${Date.now()}.csv`)
  }

  const handleExportJson = () => {
    downloadJson(sorted, `teastash-usage-${Date.now()}.json`)
  }

  if (isLoading) return null

  return (
    <div className="pb-safe-nav">
      <header className="safe-top px-4 pt-5">
        <h1 className="text-[26px] font-bold text-ink">{t('history.title')}</h1>
        {teas.length > 0 && (
          <select
            value={teaFilter}
            onChange={(e) => setTeaFilter(e.target.value)}
            className="mt-3 min-h-[44px] w-full rounded-pill border border-ink/12 bg-white px-4 text-[14px] text-ink focus:border-matcha focus:outline-none"
          >
            <option value="all">{t('history.filterAllTeas')}</option>
            {teas.map((tea) => (
              <option key={tea.id} value={tea.id}>
                {tea.name}
              </option>
            ))}
          </select>
        )}
      </header>

      <div className="mt-4 px-4">
        {usageRecords.length === 0 ? (
          <EmptyState icon={Clock} title={t('history.noRecords')} subtitle={t('history.noRecordsSubtitle')} />
        ) : (
          <>
            <Card className="grid grid-cols-3 divide-x divide-ink/6 p-4 text-center">
              <div>
                <p className="text-[19px] font-bold text-ink">{stats.total.toFixed(1)}{t('common.gramsShort')}</p>
                <p className="text-[11.5px] text-ink/45">{t('history.totalUsed')}</p>
              </div>
              <div>
                <p className="text-[19px] font-bold text-ink">{stats.avg.toFixed(1)}{t('common.gramsShort')}</p>
                <p className="text-[11.5px] text-ink/45">{t('history.avgPerUse')}</p>
              </div>
              <div>
                <p className="text-[19px] font-bold text-ink">{stats.count}</p>
                <p className="text-[11.5px] text-ink/45">{t('history.usageCount')}</p>
              </div>
            </Card>

            <Card className="mt-3 p-4">
              <h3 className="mb-3 text-[14px] font-semibold text-ink">{t('history.monthlyChart')}</h3>
              <BarChart data={monthlyData} />
            </Card>

            {purposeData.length > 0 && (
              <Card className="mt-3 p-4">
                <h3 className="mb-3 text-[14px] font-semibold text-ink">{t('history.byPurpose')}</h3>
                <div className="space-y-2.5">
                  {purposeData.map(({ purpose, grams, ratio }) => (
                    <div key={purpose}>
                      <div className="mb-1 flex items-center justify-between text-[12.5px]">
                        <span className="font-medium text-ink/70">{t(`purpose.${purpose}` as never)}</span>
                        <span className="text-ink/45">
                          {grams}
                          {t('common.gramsShort')}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-pill bg-cream">
                        <div
                          className="h-full rounded-pill bg-matcha/75"
                          style={{ width: `${Math.max(3, Math.round(ratio * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-pill border border-ink/12 bg-white text-[13.5px] font-medium text-ink"
              >
                <Download size={15} /> {t('history.exportCsv')}
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-pill border border-ink/12 bg-white text-[13.5px] font-medium text-ink"
              >
                <Download size={15} /> {t('history.exportRecords')}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {grouped.map((group) => (
                <section key={group.date}>
                  <p className="mb-1.5 px-1 text-[12.5px] font-medium text-ink/45">
                    {formatDateDisplay(group.date, language)}
                  </p>
                  <Card className="divide-y divide-ink/6 overflow-hidden">
                    {group.records.map((record) => {
                      const tea = teasById.get(record.teaId)
                      return (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => navigate(`/usage/${record.id}/edit`)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-cream/60"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium text-ink">
                              {record.time} {teaFilter === 'all' && tea ? `· ${tea.name}` : ''}
                            </p>
                            <p className="text-[12.5px] text-ink/45">{t(`purpose.${record.purpose}` as never)}</p>
                          </div>
                          <span className="shrink-0 text-[14px] font-semibold text-matcha">
                            -{record.gramsUsed}
                            {t('common.gramsShort')}
                          </span>
                        </button>
                      )
                    })}
                  </Card>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
