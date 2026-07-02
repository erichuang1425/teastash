import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Leaf } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useToast } from '../contexts/ToastContext'
import { useI18n } from '../i18n'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Field, inputClass } from '../components/form/Field'
import { todayISODate, nowTimeHHMM } from '../lib/date'
import { clampRemaining } from '../lib/teaLogic'
import type { UsagePurpose } from '../types'

const PURPOSES: UsagePurpose[] = ['usucha', 'koicha', 'latte', 'dessert', 'other']
const GRAM_PRESETS = [1, 1.5, 2, 3, 4]

export default function UsageForm() {
  const { recordId } = useParams<{ recordId: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(recordId)
  const navigate = useNavigate()
  const { teas, usageRecords, addUsageRecord, updateUsageRecord } = useAppData()
  const { t } = useI18n()
  const { showToast } = useToast()

  const existing = useMemo(() => usageRecords.find((r) => r.id === recordId), [usageRecords, recordId])

  // Most recent record for a tea — used to default grams/purpose to how this
  // tea is usually prepared, instead of a fixed 2g/usucha.
  const lastUsageFor = (id: string) => {
    let best: (typeof usageRecords)[number] | undefined
    for (const r of usageRecords) {
      if (r.teaId !== id) continue
      if (!best || r.date + r.time > best.date + best.time) best = r
    }
    return best
  }

  const initialTeaId = existing?.teaId ?? searchParams.get('teaId') ?? teas[0]?.id ?? ''

  const [teaId, setTeaId] = useState(initialTeaId)
  const [date, setDate] = useState(existing?.date ?? todayISODate())
  const [time, setTime] = useState(existing?.time ?? nowTimeHHMM())
  const [grams, setGrams] = useState(() =>
    existing ? String(existing.gramsUsed) : String(lastUsageFor(initialTeaId)?.gramsUsed ?? 2),
  )
  const [purpose, setPurpose] = useState<UsagePurpose>(
    () => existing?.purpose ?? lastUsageFor(initialTeaId)?.purpose ?? 'usucha',
  )
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [touched, setTouched] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleTeaChange = (id: string) => {
    setTeaId(id)
    if (!touched) {
      const last = lastUsageFor(id)
      setGrams(String(last?.gramsUsed ?? 2))
      setPurpose(last?.purpose ?? 'usucha')
    }
  }

  const selectedTea = teas.find((x) => x.id === teaId)

  const availableForPreview = useMemo(() => {
    if (!selectedTea) return 0
    if (isEdit && existing && existing.teaId === selectedTea.id) {
      return selectedTea.remainingG + existing.gramsUsed
    }
    return selectedTea.remainingG
  }, [selectedTea, isEdit, existing])

  const gramsNum = Number(grams)
  const preview = selectedTea && gramsNum > 0 ? clampRemaining(availableForPreview - gramsNum, selectedTea.netWeightG) : null
  const exceedsRemaining = selectedTea !== undefined && gramsNum > availableForPreview

  if (teas.length === 0) {
    return (
      <div>
        <TopBar title={t('usageForm.titleAdd')} showBack />
        <EmptyState
          icon={Leaf}
          title={t('usageForm.noTeaAvailable')}
          action={<Button onClick={() => navigate('/inventory/new')}>{t('usageForm.goToAddTea')}</Button>}
        />
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!teaId) {
      setError(t('validation.teaRequired'))
      return
    }
    if (!date) {
      setError(t('validation.dateRequired'))
      return
    }
    if (!grams || gramsNum <= 0) {
      setError(t('validation.gramsPositive'))
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      const payload = { teaId, date, time, gramsUsed: gramsNum, purpose, notes: notes.trim() }
      if (isEdit && existing) {
        await updateUsageRecord(existing.id, payload)
        showToast(t('toast.usageUpdated'))
      } else {
        await addUsageRecord(payload)
        showToast(t('toast.usageSaved'))
      }
      navigate(`/inventory/${teaId}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pb-safe-nav">
      <TopBar
        title={isEdit ? t('usageForm.titleEdit') : t('usageForm.titleAdd')}
        showBack
        leftLabel={t('common.cancel')}
      />

      <form
        className="space-y-4 px-4 pt-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <Card className="space-y-4 p-4">
          <Field label={t('usageForm.teaLabel')} error={error && !teaId ? error : undefined}>
            <select className={inputClass} value={teaId} onChange={(e) => handleTeaChange(e.target.value)}>
              {teas.map((tea) => (
                <option key={tea.id} value={tea.id}>
                  {tea.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('usageForm.dateLabel')}>
              <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t('usageForm.timeLabel')}>
              <input className={inputClass} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>

          <Field label={t('usageForm.gramsLabel')} error={error && (!grams || gramsNum <= 0) ? error : undefined}>
            <div className="mb-2 flex gap-1.5">
              {GRAM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setTouched(true)
                    setGrams(String(preset))
                  }}
                  className={`min-h-[38px] flex-1 rounded-pill text-[13.5px] font-semibold transition-colors ${
                    Number(grams) === preset ? 'bg-matcha text-white' : 'bg-cream text-ink/60'
                  }`}
                >
                  {preset}
                  {t('common.gramsShort')}
                </button>
              ))}
            </div>
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={grams}
              onChange={(e) => {
                setTouched(true)
                setGrams(e.target.value)
              }}
            />
          </Field>

          <Field label={t('usageForm.purposeLabel')}>
            <select
              className={inputClass}
              value={purpose}
              onChange={(e) => {
                setTouched(true)
                setPurpose(e.target.value as UsagePurpose)
              }}
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {t(`purpose.${p}` as never)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('usageForm.notesLabel')} optional>
            <textarea
              className={`${inputClass} min-h-[76px] resize-none py-3`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('usageForm.notesPlaceholder')}
            />
          </Field>
        </Card>

        {exceedsRemaining && selectedTea && (
          <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-[13px] text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{t('validation.gramsExceedsRemaining', { remaining: availableForPreview })}</span>
          </div>
        )}

        {preview !== null && (
          <p className="px-1 text-[13.5px] text-ink/60">{t('usageForm.remainingPreview', { grams: preview })}</p>
        )}

        <div className="pb-4">
          <Button type="submit" fullWidth disabled={isSaving}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
