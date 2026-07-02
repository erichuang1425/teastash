import { useEffect } from 'react'
import { useI18n } from '../i18n'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
}

export function ConfirmDialog({
  open,
  title,
  body,
  destructive = true,
  onConfirm,
  onCancel,
  confirmLabel,
}: ConfirmDialogProps) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-ink/40 px-4 pb-8 animate-fade-in sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-sm animate-slide-up rounded-card bg-white p-5 shadow-card">
        <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
        {body && <p className="mt-2 text-[14px] leading-relaxed text-ink/70">{body}</p>}
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" fullWidth onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} fullWidth onClick={onConfirm}>
            {confirmLabel ?? t('common.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}
