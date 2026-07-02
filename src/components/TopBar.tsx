import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface TopBarProps {
  title: string
  onBack?: () => void
  showBack?: boolean
  right?: ReactNode
  leftLabel?: string
}

export function TopBar({ title, onBack, showBack, right, leftLabel }: TopBarProps) {
  const navigate = useNavigate()
  return (
    <header className="safe-top sticky top-0 z-30 border-b border-ink/8 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-3">
        <div className="flex min-w-[44px] items-center">
          {showBack && (
            <button
              type="button"
              onClick={() => (onBack ? onBack() : navigate(-1))}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-0.5 -ml-2 text-ink"
              aria-label={leftLabel ?? 'Back'}
            >
              <ChevronLeft size={22} />
              {leftLabel && <span className="text-[15px]">{leftLabel}</span>}
            </button>
          )}
        </div>
        <h1 className="flex-1 truncate text-center text-[17px] font-semibold text-ink">{title}</h1>
        <div className="flex min-w-[44px] items-center justify-end">{right}</div>
      </div>
    </header>
  )
}
