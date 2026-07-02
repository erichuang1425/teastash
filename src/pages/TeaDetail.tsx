import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2, Plus, Leaf, Calendar, Scale, MapPin, StickyNote, Package, Gauge } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useToast } from '../contexts/ToastContext'
import { useI18n } from '../i18n'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { ProgressRing } from '../components/ProgressRing'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { formatDateDisplay, daysUntil } from '../lib/date'
import { computePace, getTeaStatus, remainingRatio } from '../lib/teaLogic'
import { DEFAULT_TIN_COLOR, tinForeground } from '../lib/palette'

function InfoRow({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon size={17} className="shrink-0 text-matcha" />
      <span className="flex-1 text-[13.5px] text-ink/55">{label}</span>
      <span className="text-[14px] font-medium text-ink">{value || '—'}</span>
    </div>
  )
}

export default function TeaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { teas, usageRecords, deleteTea, restoreTea, deleteUsageRecord, restoreUsageRecord, isLoading } = useAppData()
  const { t, language } = useI18n()
  const { showToast } = useToast()
  const [confirmDeleteTea, setConfirmDeleteTea] = useState(false)
  const [confirmDeleteRecordId, setConfirmDeleteRecordId] = useState<string | null>(null)

  const tea = teas.find((x) => x.id === id)

  const records = useMemo(
    () =>
      usageRecords
        .filter((r) => r.teaId === id)
        .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)),
    [usageRecords, id],
  )

  if (isLoading) return null

  if (!tea) {
    return (
      <div>
        <TopBar title="" showBack />
        <EmptyState icon={Leaf} title={t('emptyState.genericTitle')} />
      </div>
    )
  }

  const status = getTeaStatus(tea)
  const daysUntilOpened = tea.openedDate ? daysUntil(tea.openedDate) : null
  const daysSinceOpened = daysUntilOpened !== null ? Math.max(0, -daysUntilOpened) : null
  const pace = computePace(tea, usageRecords)
  const teaStats =
    records.length > 0
      ? {
          total: records.reduce((sum, r) => sum + r.gramsUsed, 0),
          count: records.length,
        }
      : null

  return (
    <div className="pb-safe-nav">
      <TopBar
        title={tea.name}
        showBack
        right={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate(`/inventory/${tea.id}/edit`)}
              className="flex h-10 w-10 items-center justify-center text-ink/70"
              aria-label={t('teaDetail.editTea')}
            >
              <Pencil size={19} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteTea(true)}
              className="flex h-10 w-10 items-center justify-center text-red-500"
              aria-label={t('teaDetail.deleteTea')}
            >
              <Trash2 size={19} />
            </button>
          </div>
        }
      />

      <div className="px-4 pt-4">
        {tea.imageDataUrl ? (
          <img src={tea.imageDataUrl} alt={tea.name} className="h-56 w-full rounded-card object-cover shadow-soft" />
        ) : (
          <div
            className="flex h-40 w-full items-center justify-center rounded-card shadow-soft"
            style={{
              backgroundColor: tea.tinColor ?? DEFAULT_TIN_COLOR,
              color: tinForeground(tea.tinColor ?? DEFAULT_TIN_COLOR),
            }}
          >
            <Leaf size={40} strokeWidth={1.5} />
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <h2 className="text-[19px] font-bold text-ink">{tea.name}</h2>
          <Badge tone={status === 'active' ? 'matcha' : status === 'unopened' ? 'tan' : 'gray'}>
            {t(`status.${status}` as never)}
          </Badge>
        </div>
        <p className="text-[13.5px] text-ink/50">
          {[tea.brand, t(`teaType.${tea.teaType}` as never)].filter(Boolean).join(' · ')}
        </p>

        <Card className="mt-4 flex items-center gap-5 p-4">
          <ProgressRing ratio={remainingRatio(tea)} />
          <div>
            <p className="text-[13px] text-ink/50">{t('teaDetail.remainingLabel')}</p>
            <p className="text-[22px] font-bold text-ink">
              {tea.remainingG}
              <span className="text-[14px] font-medium text-ink/50"> / {tea.netWeightG} {t('common.gramsShort')}</span>
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink/45">
              {tea.openedDate
                ? t('teaDetail.daysSinceOpened', { days: daysSinceOpened ?? 0 })
                : t('teaDetail.notOpenedYet')}
            </p>
          </div>
        </Card>

        {pace && (
          <Card className="mt-3 p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-ink/55">
              <Gauge size={15} className="text-matcha" /> {t('teaDetail.paceTitle')}
            </div>
            <p className="text-[14px] font-medium text-ink">
              {t('teaDetail.paceLine', { grams: pace.gPerDay.toFixed(1), days: pace.daysToEmpty })}
            </p>
            {pace.finishBeforeExpiry !== null && (
              <p className={`mt-1 text-[13px] ${pace.finishBeforeExpiry ? 'text-matcha' : 'text-amber-700'}`}>
                {pace.finishBeforeExpiry
                  ? t('teaDetail.paceOnTrack')
                  : t('teaDetail.paceBehind', { grams: (pace.requiredGPerDay ?? 0).toFixed(1) })}
              </p>
            )}
          </Card>
        )}

        <Card className="mt-3 divide-y divide-ink/6 overflow-hidden">
          <InfoRow icon={Calendar} label={t('teaDetail.purchaseDate')} value={formatDateDisplay(tea.purchaseDate, language)} />
          <InfoRow icon={Scale} label={t('teaDetail.initialWeight')} value={`${tea.netWeightG} ${t('common.gramsShort')}`} />
          <InfoRow icon={Package} label={t('teaDetail.openedDate')} value={formatDateDisplay(tea.openedDate, language)} />
          <InfoRow
            icon={Calendar}
            label={t('teaDetail.openedRecommendedExpiry')}
            value={formatDateDisplay(tea.openedExpiryDate, language)}
          />
          <InfoRow icon={Calendar} label={t('teaDetail.unopenedExpiry')} value={formatDateDisplay(tea.unopenedExpiryDate, language)} />
          <InfoRow icon={MapPin} label={t('teaDetail.storageLocation')} value={tea.storageLocation} />
        </Card>

        {tea.notes && (
          <Card className="mt-3 p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-ink/55">
              <StickyNote size={15} /> {t('teaDetail.notes')}
            </div>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{tea.notes}</p>
          </Card>
        )}

        <div className="mt-4">
          <Button fullWidth onClick={() => navigate(`/usage/new?teaId=${tea.id}`)}>
            <Plus size={18} /> {t('teaDetail.addUsage')}
          </Button>
        </div>

        <section className="mt-6">
          <h3 className="mb-2 text-[15px] font-semibold text-ink">{t('teaDetail.usageHistory')}</h3>
          {teaStats && (
            <Card className="mb-2 grid grid-cols-3 divide-x divide-ink/6 p-3 text-center">
              <div>
                <p className="text-[16px] font-bold text-ink">
                  {teaStats.total.toFixed(1)}
                  {t('common.gramsShort')}
                </p>
                <p className="text-[11px] text-ink/45">{t('history.totalUsed')}</p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-ink">
                  {(teaStats.total / teaStats.count).toFixed(1)}
                  {t('common.gramsShort')}
                </p>
                <p className="text-[11px] text-ink/45">{t('history.avgPerUse')}</p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-ink">{teaStats.count}</p>
                <p className="text-[11px] text-ink/45">{t('history.usageCount')}</p>
              </div>
            </Card>
          )}
          {records.length === 0 ? (
            <Card className="p-4 text-[13.5px] text-ink/50">{t('teaDetail.noUsageYet')}</Card>
          ) : (
            <Card className="divide-y divide-ink/6 overflow-hidden">
              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => navigate(`/usage/${record.id}/edit`)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-cream/60"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-ink">
                      {formatDateDisplay(record.date, language)} · {record.time}
                    </p>
                    <p className="truncate text-[12.5px] text-ink/45">
                      {t(`purpose.${record.purpose}` as never)}
                      {record.notes ? ` · ${record.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[14px] font-semibold text-matcha">
                      -{record.gramsUsed}
                      {t('common.gramsShort')}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDeleteRecordId(record.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation()
                          setConfirmDeleteRecordId(record.id)
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center text-ink/30"
                    >
                      <Trash2 size={16} />
                    </span>
                  </div>
                </button>
              ))}
            </Card>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmDeleteTea}
        title={t('teaDetail.deleteConfirmTitle')}
        body={t('teaDetail.deleteConfirmBody', { name: tea.name })}
        onCancel={() => setConfirmDeleteTea(false)}
        onConfirm={async () => {
          const teaSnapshot = tea
          const recordsSnapshot = records
          await deleteTea(tea.id)
          setConfirmDeleteTea(false)
          showToast(t('toast.teaDeleted'), {
            label: t('common.undo'),
            onAction: () => restoreTea(teaSnapshot, recordsSnapshot),
          })
          navigate('/inventory')
        }}
      />

      <ConfirmDialog
        open={confirmDeleteRecordId !== null}
        title={t('confirm.deleteUsageTitle')}
        body={
          confirmDeleteRecordId
            ? t('confirm.deleteUsageBody', {
                grams: records.find((r) => r.id === confirmDeleteRecordId)?.gramsUsed ?? 0,
              })
            : undefined
        }
        onCancel={() => setConfirmDeleteRecordId(null)}
        onConfirm={async () => {
          if (confirmDeleteRecordId) {
            const recordSnapshot = records.find((r) => r.id === confirmDeleteRecordId)
            await deleteUsageRecord(confirmDeleteRecordId)
            showToast(
              t('toast.usageDeleted'),
              recordSnapshot
                ? { label: t('common.undo'), onAction: () => restoreUsageRecord(recordSnapshot) }
                : undefined,
            )
          }
          setConfirmDeleteRecordId(null)
        }}
      />
    </div>
  )
}
