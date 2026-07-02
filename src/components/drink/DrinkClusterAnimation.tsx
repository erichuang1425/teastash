import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { DrinkRecord, DrinkType } from '../../types'
import { useI18n } from '../../i18n'
import { DrinkAvatar } from './DrinkAvatar'

interface DrinkClusterAnimationProps {
  records: DrinkRecord[]
  animationKey: string
}

interface ClusterItem {
  id: string
  record?: DrinkRecord
  type: DrinkType
  x: number
  y: number
  rotation: number
  delay: number
  start: number
}

const placeholderTypes: DrinkType[] = ['tea', 'milkTea', 'greenTea', 'latte', 'oolongTea']

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

function buildItems(records: DrinkRecord[]): ClusterItem[] {
  const source = records.slice(0, 16)
  const baseItems =
    source.length > 0
      ? source.map((record, index) => ({ id: record.id, record, type: record.drinkType, index }))
      : placeholderTypes.map((type, index) => ({ id: `placeholder-${type}`, type, index }))

  return baseItems.map((item) => {
    const ring = item.index % 8
    const row = Math.floor(item.index / 8)
    const x = (ring - 3.5) * 18 + (row % 2 === 0 ? 0 : 9)
    const y = (row - 0.5) * 18 + Math.sin(item.index * 1.7) * 7
    return {
      ...item,
      x,
      y,
      rotation: ((item.index % 5) - 2) * 5,
      delay: item.index * 42,
      start: -120 - item.index * 12,
    }
  })
}

export function DrinkClusterAnimation({ records, animationKey }: DrinkClusterAnimationProps) {
  const { t } = useI18n()
  const reducedMotion = useReducedMotion()
  const [runKey, setRunKey] = useState(0)
  const items = useMemo(() => buildItems(records), [records])
  const isEmpty = records.length === 0

  useEffect(() => {
    setRunKey((current) => current + 1)
  }, [animationKey])

  return (
    <div className="relative min-h-[230px] overflow-hidden rounded-[30px] bg-white shadow-soft">
      <div className="absolute inset-x-8 top-9 h-28 rounded-[999px] bg-cream/70 blur-2xl" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[138px] w-[230px]" key={runKey}>
          {items.map((item) => (
            <div
              key={item.id}
              className={reducedMotion ? 'drink-cluster-static absolute left-1/2 top-1/2' : 'drink-cluster-item absolute left-1/2 top-1/2'}
              style={
                {
                  '--cluster-x': `${item.x}px`,
                  '--cluster-y': `${item.y}px`,
                  '--cluster-rotation': `${item.rotation}deg`,
                  '--cluster-delay': `${item.delay}ms`,
                  '--cluster-start': `${item.start}px`,
                } as CSSProperties
              }
            >
              <DrinkAvatar record={item.record} type={item.type} className="h-12 w-12" iconSize={20} />
            </div>
          ))}
        </div>
      </div>
      {isEmpty && (
        <div className="absolute inset-x-8 bottom-7 text-center">
          <p className="text-[16px] font-black text-ink">{t('empty.noDrinks')}</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink/50">{t('empty.statsLater')}</p>
        </div>
      )}
    </div>
  )
}
