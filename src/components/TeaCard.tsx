import { Leaf } from 'lucide-react'
import type { TeaItem } from '../types'
import { useI18n } from '../i18n'
import { Badge } from './Badge'
import { getTeaStatus, openedExpiryDaysLeft, unopenedExpiryDaysLeft } from '../lib/teaLogic'
import { DEFAULT_TIN_COLOR, tinForeground } from '../lib/palette'

interface TeaCardProps {
  tea: TeaItem
  onClick: () => void
  useFirst?: boolean
}

export function TeaCard({ tea, onClick, useFirst = false }: TeaCardProps) {
  const { t } = useI18n()
  const status = getTeaStatus(tea)

  const statusLabel = t(`status.${status}` as never)
  const statusTone = status === 'active' ? 'matcha' : status === 'unopened' ? 'tan' : 'gray'

  let expiryHint: string | null = null
  let expiryTone: 'amber' | 'red' | null = null
  if (status === 'active') {
    const days = openedExpiryDaysLeft(tea)
    if (days !== null) {
      if (days < 0) {
        expiryHint = t('reminders.expiredDays', { days: Math.abs(days) })
        expiryTone = 'red'
      } else if (days <= 21) {
        expiryHint = t('inventory.daysUntilRecommended', { days })
        expiryTone = 'amber'
      }
    }
  } else if (status === 'unopened') {
    const days = unopenedExpiryDaysLeft(tea)
    if (days !== null && days <= 30) {
      expiryHint = t('inventory.daysUntilRecommended', { days: Math.max(days, 0) })
      expiryTone = days < 0 ? 'red' : 'amber'
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-card bg-white p-3 text-left shadow-soft active:scale-[0.99] transition-transform"
    >
      {tea.imageDataUrl ? (
        <img src={tea.imageDataUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
      ) : (
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: tea.tinColor ?? DEFAULT_TIN_COLOR,
            color: tinForeground(tea.tinColor ?? DEFAULT_TIN_COLOR),
          }}
        >
          <Leaf size={22} strokeWidth={1.75} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-semibold text-ink">{tea.name}</p>
          <Badge tone={statusTone}>{statusLabel}</Badge>
          {useFirst && <Badge tone="amber">{t('inventory.useFirst')}</Badge>}
        </div>
        <p className="truncate text-[13px] text-ink/50">{[tea.brand, t(`teaType.${tea.teaType}` as never)].filter(Boolean).join(' · ')}</p>
        <div className="mt-1 flex items-center gap-2 text-[12.5px]">
          <span className="font-medium text-ink/70">
            {t('inventory.remaining')} {tea.remainingG}
            {t('common.gramsShort')}
          </span>
          {expiryHint && (
            <span className={expiryTone === 'red' ? 'text-red-600' : 'text-amber-700'}>{expiryHint}</span>
          )}
        </div>
      </div>
    </button>
  )
}
