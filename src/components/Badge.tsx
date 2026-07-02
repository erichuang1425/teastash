import type { ReactNode } from 'react'

type Tone = 'matcha' | 'tan' | 'amber' | 'red' | 'gray'

const toneClasses: Record<Tone, string> = {
  matcha: 'bg-matcha/15 text-matcha',
  tan: 'bg-tan text-ink/70',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-ink/8 text-ink/60',
}

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-pill px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}
