import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, X, Check } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useToast } from '../contexts/ToastContext'
import { useI18n } from '../i18n'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Field, inputClass } from '../components/form/Field'
import { fileToResizedDataUrl } from '../lib/image'
import { addDays, daysBetween, formatDateDisplay, todayISODate } from '../lib/date'
import { TIN_COLORS, DEFAULT_TIN_COLOR, tinForeground } from '../lib/palette'
import type { TeaType } from '../types'

const TEA_TYPES: TeaType[] = ['matcha', 'sencha', 'genmaicha', 'houjicha', 'oolong', 'blackTea', 'puerh', 'other']

export default function TeaForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { teas, addTea, updateTea } = useAppData()
  const { t, language } = useI18n()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existing = useMemo(() => teas.find((x) => x.id === id), [teas, id])

  const [name, setName] = useState(existing?.name ?? '')
  const [brand, setBrand] = useState(existing?.brand ?? '')
  const [teaType, setTeaType] = useState<TeaType>(existing?.teaType ?? 'matcha')
  const [tinColor, setTinColor] = useState(existing?.tinColor ?? DEFAULT_TIN_COLOR)
  const [netWeightG, setNetWeightG] = useState(existing ? String(existing.netWeightG) : '')
  const [remainingG, setRemainingG] = useState(existing ? String(existing.remainingG) : '')
  const [remainingTouched, setRemainingTouched] = useState(isEdit)
  const [purchaseDate, setPurchaseDate] = useState(existing?.purchaseDate ?? todayISODate())
  const [status, setStatus] = useState<'unopened' | 'opened'>(existing?.openedDate ? 'opened' : 'unopened')
  const [openedDate, setOpenedDate] = useState(existing?.openedDate ?? todayISODate())
  const [openedShelfDays, setOpenedShelfDays] = useState(() => {
    if (existing?.openedDate && existing?.openedExpiryDate) {
      return String(daysBetween(existing.openedDate, existing.openedExpiryDate))
    }
    return '30'
  })
  const [unopenedExpiryDate, setUnopenedExpiryDate] = useState(existing?.unopenedExpiryDate ?? '')
  const [storageLocation, setStorageLocation] = useState(existing?.storageLocation ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(existing?.imageDataUrl ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Opened expiry is derived from opened date + shelf-life days, so the user
  // never hand-computes it. Empty days = no opened expiry.
  const computedOpenedExpiry =
    status === 'opened' && openedDate && openedShelfDays !== '' && Number(openedShelfDays) >= 0
      ? addDays(openedDate, Number(openedShelfDays))
      : null

  const handleNetWeightChange = (value: string) => {
    setNetWeightG(value)
    if (!remainingTouched) setRemainingG(value)
  }

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      setImageDataUrl(dataUrl)
    } catch {
      showToast(t('validation.invalidFile'))
    }
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    const netWeight = Number(netWeightG)
    const remaining = Number(remainingG)

    if (!name.trim()) nextErrors.name = t('validation.nameRequired')
    if (!netWeightG || netWeight <= 0) nextErrors.netWeightG = t('validation.netWeightPositive')
    if (remainingG === '' || remaining < 0) nextErrors.remainingG = t('validation.remainingNotNegative')
    else if (netWeight > 0 && remaining > netWeight) nextErrors.remainingG = t('validation.remainingExceedsNet')
    if (status === 'opened' && purchaseDate && openedDate && openedDate < purchaseDate) {
      nextErrors.openedDate = t('validation.dateOrderInvalid')
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (addAnother: boolean) => {
    if (!validate()) return
    setIsSaving(true)
    try {
      const isOpened = status === 'opened'
      const payload = {
        name: name.trim(),
        brand: brand.trim(),
        teaType,
        tinColor,
        netWeightG: Number(netWeightG),
        remainingG: Number(remainingG),
        purchaseDate: purchaseDate || null,
        openedDate: isOpened ? openedDate || todayISODate() : null,
        unopenedExpiryDate: unopenedExpiryDate || null,
        openedExpiryDate: isOpened ? computedOpenedExpiry : null,
        storageLocation: storageLocation.trim(),
        notes: notes.trim(),
        imageDataUrl,
        sortOrder: existing?.sortOrder ?? Date.now(),
      }

      if (isEdit && existing) {
        await updateTea(existing.id, payload)
        showToast(t('toast.teaSaved'))
        navigate(`/inventory/${existing.id}`)
      } else {
        const created = await addTea(payload)
        showToast(t('toast.teaSaved'))
        if (addAnother) {
          setName('')
          setBrand('')
          setNetWeightG('')
          setRemainingG('')
          setRemainingTouched(false)
          setStatus('unopened')
          setOpenedDate(todayISODate())
          setOpenedShelfDays('30')
          setUnopenedExpiryDate('')
          setStorageLocation('')
          setNotes('')
          setImageDataUrl(null)
          setErrors({})
        } else {
          navigate(`/inventory/${created.id}`)
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pb-safe-nav">
      <TopBar title={isEdit ? t('teaForm.titleEdit') : t('teaForm.titleAdd')} showBack leftLabel={t('common.cancel')} />

      <form
        className="space-y-4 px-4 pt-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(false)
        }}
      >
        <Card className="space-y-4 p-4">
          <Field label={t('teaForm.imageLabel')} optional>
            <div className="flex items-center gap-3">
              {imageDataUrl ? (
                <div className="relative">
                  <img src={imageDataUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageDataUrl(null)}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white shadow-soft"
                    aria-label={t('teaForm.removeImage')}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl"
                  style={{ backgroundColor: tinColor, color: tinForeground(tinColor) }}
                  aria-label={t('teaForm.uploadImage')}
                >
                  <Camera size={22} />
                </button>
              )}
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                {imageDataUrl ? t('teaForm.changeImage') : t('teaForm.uploadImage')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImagePick(e.target.files?.[0])}
              />
            </div>
          </Field>

          <Field label={t('teaForm.tinColorLabel')}>
            <div className="flex flex-wrap gap-2.5">
              {TIN_COLORS.map((color) => {
                const selected = tinColor.toLowerCase() === color.toLowerCase()
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTinColor(color)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90 ${
                      selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-white' : ''
                    }`}
                    style={{ backgroundColor: color, color: tinForeground(color) }}
                    aria-label={color}
                    aria-pressed={selected}
                  >
                    {selected && <Check size={16} strokeWidth={2.5} />}
                  </button>
                )
              })}
            </div>
          </Field>
        </Card>

        <Card className="space-y-4 p-4">
          <Field label={t('teaForm.nameLabel')} error={errors.name}>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('teaForm.namePlaceholder')}
            />
          </Field>
          <Field label={t('teaForm.brandLabel')} optional>
            <input
              className={inputClass}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('teaForm.brandPlaceholder')}
            />
          </Field>
          <Field label={t('teaForm.teaTypeLabel')}>
            <select className={inputClass} value={teaType} onChange={(e) => setTeaType(e.target.value as TeaType)}>
              {TEA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`teaType.${type}` as never)}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        <Card className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('teaForm.netWeightLabel')} error={errors.netWeightG}>
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={netWeightG}
                onChange={(e) => handleNetWeightChange(e.target.value)}
              />
            </Field>
            <Field label={t('teaForm.remainingLabel')} error={errors.remainingG}>
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={remainingG}
                onChange={(e) => {
                  setRemainingTouched(true)
                  setRemainingG(e.target.value)
                }}
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4 p-4">
          <Field label={t('teaForm.statusLabel')}>
            <div className="flex gap-2">
              {(['unopened', 'opened'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`min-h-[44px] flex-1 rounded-2xl text-[14px] font-semibold transition-colors ${
                    status === value ? 'bg-matcha text-white' : 'bg-cream text-ink/55'
                  }`}
                >
                  {value === 'unopened' ? t('teaForm.statusUnopened') : t('teaForm.statusOpened')}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('teaForm.purchaseDateLabel')} optional>
              <input
                className={inputClass}
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </Field>
            <Field label={t('teaForm.unopenedExpiryLabel')} optional>
              <input
                className={inputClass}
                type="date"
                value={unopenedExpiryDate}
                onChange={(e) => setUnopenedExpiryDate(e.target.value)}
              />
            </Field>
          </div>

          {status === 'opened' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('teaForm.openedDateLabel')} error={errors.openedDate}>
                <input className={inputClass} type="date" value={openedDate} onChange={(e) => setOpenedDate(e.target.value)} />
              </Field>
              <Field label={t('teaForm.openedShelfDaysLabel')}>
                <input
                  className={inputClass}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step="1"
                  value={openedShelfDays}
                  onChange={(e) => setOpenedShelfDays(e.target.value)}
                />
                <div className="mt-1.5 flex items-center gap-1.5">
                  {[30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setOpenedShelfDays(String(days))}
                      className={`min-h-[32px] flex-1 rounded-pill text-[12px] font-semibold transition-colors ${
                        Number(openedShelfDays) === days ? 'bg-matcha text-white' : 'bg-cream text-ink/60'
                      }`}
                    >
                      {t('teaForm.plusDays', { days })}
                    </button>
                  ))}
                </div>
              </Field>
              {computedOpenedExpiry && (
                <p className="col-span-2 -mt-1 text-[12.5px] text-matcha">
                  {t('teaForm.computedExpiry', { date: formatDateDisplay(computedOpenedExpiry, language) })}
                </p>
              )}
            </div>
          )}
        </Card>

        <Card className="space-y-4 p-4">
          <Field label={t('teaForm.storageLocationLabel')} optional>
            <input
              className={inputClass}
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder={t('teaForm.storageLocationPlaceholder')}
            />
          </Field>
          <Field label={t('teaForm.notesLabel')} optional>
            <textarea
              className={`${inputClass} min-h-[88px] resize-none py-3`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('teaForm.notesPlaceholder')}
            />
          </Field>
        </Card>

        <div className="space-y-2 pb-4">
          <Button type="submit" fullWidth disabled={isSaving}>
            {t('common.save')}
          </Button>
          {!isEdit && (
            <Button type="button" variant="secondary" fullWidth disabled={isSaving} onClick={() => handleSubmit(true)}>
              {t('teaForm.saveAndAddAnother')}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
