import { ChevronRight } from 'lucide-react'
import type { DrinkRecord } from '../../types'
import { useI18n } from '../../i18n'
import { formatSpend } from '../../lib/drinkLogic'
import { DrinkAvatar } from './DrinkAvatar'

interface DrinkRecordCardProps {
  record: DrinkRecord
  onClick?: () => void
}

export function DrinkRecordCard({ record, onClick }: DrinkRecordCardProps) {
  const { t } = useI18n()
  const title = record.name.trim() || t(`drinkType.${record.drinkType}` as never)
  const meta = [t(`drinkSize.${record.size}` as never), record.time].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-card bg-white px-4 py-3 text-left shadow-soft transition active:scale-[0.99]"
    >
      <DrinkAvatar record={record} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-bold text-ink">{title}</p>
        <p className="mt-0.5 truncate text-[13.5px] font-medium text-ink/50">{meta}</p>
        {(record.spendAmount > 0 || record.sugarG > 0 || record.homemade) && (
          <p className="mt-1 truncate text-[12.5px] text-ink/40">
            {[
              record.spendAmount > 0 ? `${t('statistics.spendPrefix')}${formatSpend(record.spendAmount)}` : '',
              record.sugarG > 0 ? `${record.sugarG}${t('common.gramsShort')} ${t('addDrink.sugarShort')}` : '',
              record.homemade ? t('addDrink.homemade') : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <p className="text-[20px] font-black leading-none text-roast">{Math.round(record.caffeineMg)}</p>
          <p className="mt-1 text-[12px] font-semibold text-ink/45">mg</p>
        </div>
        {onClick && <ChevronRight size={17} className="text-ink/25" />}
      </div>
    </button>
  )
}
