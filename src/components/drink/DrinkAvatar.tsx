import { Coffee, CupSoda, GlassWater, Home, Leaf, Zap, type LucideIcon } from 'lucide-react'
import type { DrinkRecord, DrinkType } from '../../types'

interface DrinkAvatarProps {
  record?: DrinkRecord
  type?: DrinkType
  className?: string
  iconSize?: number
}

const iconByType: Record<DrinkType, LucideIcon> = {
  tea: Leaf,
  greenTea: Leaf,
  oolongTea: Leaf,
  blackTea: Leaf,
  milkTea: CupSoda,
  powderedTea: Leaf,
  coffee: Coffee,
  espresso: Coffee,
  latte: Coffee,
  homemade: Home,
  energyDrink: Zap,
  other: GlassWater,
}

const toneByType: Record<DrinkType, string> = {
  tea: 'bg-leaf/12 text-leaf',
  greenTea: 'bg-leaf/12 text-leaf',
  oolongTea: 'bg-roast/12 text-roast',
  blackTea: 'bg-roast/12 text-roast',
  milkTea: 'bg-tan/70 text-roast',
  powderedTea: 'bg-leaf/12 text-leaf',
  coffee: 'bg-roast/12 text-roast',
  espresso: 'bg-roast/12 text-roast',
  latte: 'bg-tan/70 text-roast',
  homemade: 'bg-cream text-roast',
  energyDrink: 'bg-amber-100 text-amber-700',
  other: 'bg-cream text-ink/55',
}

export function DrinkAvatar({ record, type, className = 'h-14 w-14', iconSize = 24 }: DrinkAvatarProps) {
  const drinkType = record?.drinkType ?? type ?? 'tea'
  const Icon = iconByType[drinkType]

  if (record?.imageDataUrl) {
    return (
      <img
        src={record.imageDataUrl}
        alt=""
        className={`${className} shrink-0 rounded-[18px] object-cover shadow-[0_4px_14px_rgba(80,61,38,0.12)]`}
      />
    )
  }

  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-[18px] ${toneByType[drinkType]}`}>
      <Icon size={iconSize} strokeWidth={1.9} />
    </div>
  )
}
