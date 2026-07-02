import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tan/60 text-matcha">
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-ink/60">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
