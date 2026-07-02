import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarDays, Home, ImagePlus, Trash2, X } from 'lucide-react'
import type { DrinkSize, DrinkType } from '../types'
import { useI18n } from '../i18n'
import { useDrinkData, type DrinkInput } from '../contexts/DrinkDataContext'
import { useToast } from '../contexts/ToastContext'
import { defaultCaffeineFor, DRINK_SIZES, DRINK_TYPES } from '../lib/drinkLogic'
import { nowTimeHHMM, todayISODate } from '../lib/date'
import { fileToResizedDataUrl } from '../lib/image'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field, inputClass } from '../components/form/Field'
import { DrinkAvatar } from '../components/drink/DrinkAvatar'

function readNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export default function AddDrink() {
  const { recordId } = useParams<{ recordId: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(recordId)
  const { t } = useI18n()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { records, isLoading, addDrinkRecord, updateDrinkRecord, deleteDrinkRecord } = useDrinkData()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existing = useMemo(() => records.find((record) => record.id === recordId), [recordId, records])
  const [date, setDate] = useState(searchParams.get('date') ?? todayISODate())
  const [time, setTime] = useState(nowTimeHHMM())
  const [name, setName] = useState('')
  const [drinkType, setDrinkType] = useState<DrinkType>('tea')
  const [size, setSize] = useState<DrinkSize>('medium')
  const [caffeineMg, setCaffeineMg] = useState(String(defaultCaffeineFor('tea')))
  const [spendAmount, setSpendAmount] = useState('')
  const [sugarG, setSugarG] = useState('')
  const [homemade, setHomemade] = useState(false)
  const [brewingDetails, setBrewingDetails] = useState('')
  const [notes, setNotes] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!existing) return
    setDate(existing.date)
    setTime(existing.time)
    setName(existing.name)
    setDrinkType(existing.drinkType)
    setSize(existing.size)
    setCaffeineMg(String(existing.caffeineMg))
    setSpendAmount(existing.spendAmount > 0 ? String(existing.spendAmount) : '')
    setSugarG(existing.sugarG > 0 ? String(existing.sugarG) : '')
    setHomemade(existing.homemade)
    setBrewingDetails(existing.brewingDetails)
    setNotes(existing.notes)
    setImageDataUrl(existing.imageDataUrl)
  }, [existing])

  const changeDrinkType = (nextType: DrinkType) => {
    setDrinkType((current) => {
      if (!caffeineMg || Number(caffeineMg) === defaultCaffeineFor(current)) {
        setCaffeineMg(String(defaultCaffeineFor(nextType)))
      }
      return nextType
    })
  }

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setImageDataUrl(await fileToResizedDataUrl(file))
    } catch {
      setError(t('addDrink.photoError'))
    } finally {
      event.target.value = ''
    }
  }

  const buildPayload = (): DrinkInput | null => {
    if (!date || !time) {
      setError(t('validation.dateRequired'))
      return null
    }

    const payload: DrinkInput = {
      date,
      time,
      name: name.trim(),
      drinkType,
      size,
      caffeineMg: readNumber(caffeineMg),
      spendAmount: readNumber(spendAmount),
      sugarG: readNumber(sugarG),
      homemade,
      brewingDetails: homemade ? brewingDetails.trim() : '',
      notes: notes.trim(),
      imageDataUrl,
    }
    setError(null)
    return payload
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = buildPayload()
    if (!payload) return
    setIsSaving(true)
    try {
      if (isEdit && existing) {
        await updateDrinkRecord(existing.id, payload)
        showToast(t('toast.drinkUpdated'))
      } else {
        await addDrinkRecord(payload)
        showToast(t('toast.drinkSaved'))
      }
      navigate(`/app/day/${payload.date}`, { replace: true })
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existing) return
    setIsSaving(true)
    try {
      await deleteDrinkRecord(existing.id)
      showToast(t('toast.drinkDeleted'))
      navigate(`/app/day/${existing.date}`, { replace: true })
    } catch (deleteError) {
      setError(errorMessage(deleteError))
    } finally {
      setIsSaving(false)
      setConfirmDelete(false)
    }
  }

  if (isLoading) {
    return <div className="px-5 py-12 text-center text-[15px] font-semibold text-ink/55">{t('common.loading')}</div>
  }

  if (isEdit && !existing) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <p className="text-[20px] font-black text-ink">{t('addDrink.notFound')}</p>
        <Button className="mt-5" onClick={() => navigate('/app')}>
          {t('common.back')}
        </Button>
      </div>
    )
  }

  return (
    <form className="min-h-svh bg-white pb-safe-nav text-ink" onSubmit={handleSubmit}>
      <div className="safe-top sticky top-0 z-20 border-b border-ink/8 bg-white/92 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <button type="button" className="min-h-11 text-[17px] font-black text-roast" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </button>
          <h1 className="text-[24px] font-black">{isEdit ? t('addDrink.titleEdit') : t('addDrink.titleAdd')}</h1>
          <button type="submit" disabled={isSaving} className="min-h-11 text-[17px] font-black text-roast disabled:opacity-45">
            {t('common.save')}
          </button>
        </div>
      </div>

      <div className="space-y-6 px-5 py-6">
        <section>
          <p className="mb-3 text-[22px] font-black text-ink/48">{t('addDrink.photoOptional')}</p>
          <div className="flex items-center gap-4">
            {imageDataUrl ? (
              <div className="relative">
                <img src={imageDataUrl} alt="" className="h-32 w-32 rounded-[30px] object-cover shadow-card" />
                <button
                  type="button"
                  onClick={() => setImageDataUrl(null)}
                  className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink/55 shadow-soft"
                  aria-label={t('addDrink.removePhoto')}
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-[30px] bg-cream text-roast"
              >
                <ImagePlus size={28} />
                <span className="text-[13px] font-black">{t('addDrink.addPhoto')}</span>
              </button>
            )}
            <div className="flex-1">
              <DrinkAvatar type={drinkType} className="h-16 w-16" />
              <p className="mt-3 text-[13.5px] leading-5 text-ink/48">{t('addDrink.photoHint')}</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </section>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-roast">
              <CalendarDays size={22} />
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3">
              <Field label={t('addDrink.date')}>
                <input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </Field>
              <Field label={t('addDrink.time')}>
                <input className={inputClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              </Field>
            </div>
          </div>
        </Card>

        <Field label={t('addDrink.nameOptional')}>
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder={t('addDrink.namePlaceholder')} />
        </Field>

        <Field label={t('addDrink.drinkType')}>
          <select className={inputClass} value={drinkType} onChange={(event) => changeDrinkType(event.target.value as DrinkType)}>
            {DRINK_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`drinkType.${type}` as never)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('addDrink.size')}>
          <div className="grid grid-cols-4 gap-2">
            {DRINK_SIZES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSize(item)}
                className={`min-h-[48px] rounded-full text-[14px] font-black ${
                  size === item ? 'bg-roast text-white shadow-soft' : 'bg-cream text-ink/58'
                }`}
              >
                {t(`drinkSize.${item}` as never)}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t('addDrink.caffeine')}>
            <input className={inputClass} type="number" inputMode="decimal" min="0" value={caffeineMg} onChange={(event) => setCaffeineMg(event.target.value)} />
          </Field>
          <Field label={t('addDrink.spend')}>
            <input className={inputClass} type="number" inputMode="decimal" min="0" step="0.01" value={spendAmount} onChange={(event) => setSpendAmount(event.target.value)} />
          </Field>
          <Field label={t('addDrink.sugarOptional')}>
            <input className={inputClass} type="number" inputMode="decimal" min="0" step="0.1" value={sugarG} onChange={(event) => setSugarG(event.target.value)} />
          </Field>
        </div>

        <Card className="p-4">
          <label className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tan text-roast">
              <Home size={24} strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-black text-ink">{t('addDrink.homemade')}</span>
              <span className="mt-0.5 block text-[13.5px] leading-5 text-ink/48">{t('addDrink.homemadeBody')}</span>
            </span>
            <input
              type="checkbox"
              className="h-7 w-7 accent-[#967447]"
              checked={homemade}
              onChange={(event) => setHomemade(event.target.checked)}
              aria-label={t('addDrink.homemade')}
            />
          </label>
          {homemade && (
            <div className="mt-4">
              <Field label={t('addDrink.brewingDetails')}>
                <textarea
                  className={`${inputClass} min-h-[96px] resize-none py-3`}
                  value={brewingDetails}
                  onChange={(event) => setBrewingDetails(event.target.value)}
                  placeholder={t('addDrink.brewingPlaceholder')}
                />
              </Field>
            </div>
          )}
        </Card>

        <Field label={t('addDrink.notesOptional')}>
          <textarea
            className={`${inputClass} min-h-[92px] resize-none py-3`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('addDrink.notesPlaceholder')}
          />
        </Field>

        {error && <p className="rounded-[20px] bg-red-50 px-4 py-3 text-[14px] font-semibold leading-5 text-red-700">{error}</p>}

        {isEdit && (
          <Button type="button" variant="danger" fullWidth disabled={isSaving} onClick={() => setConfirmDelete(true)}>
            <Trash2 size={18} /> {t('addDrink.delete')}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t('addDrink.deleteTitle')}
        body={t('addDrink.deleteBody')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </form>
  )
}
