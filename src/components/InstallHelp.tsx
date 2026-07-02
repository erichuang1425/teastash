import { useEffect } from 'react'
import { Share, SquarePlus, ToggleRight, PlusSquare } from 'lucide-react'
import { useI18n } from '../i18n'
import { Button } from './Button'

const STEP_ICONS = [Share, SquarePlus, ToggleRight, PlusSquare]

interface InstallHelpModalProps {
  open: boolean
  onClose: () => void
  variant?: 'ios' | 'generic'
}

export function InstallHelpModal({ open, onClose, variant = 'ios' }: InstallHelpModalProps) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const steps = [t('install.iosStep1'), t('install.iosStep2'), t('install.iosStep3'), t('install.iosStep4')]

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-ink/40 px-4 pb-8 animate-fade-in sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm animate-slide-up rounded-card bg-white p-5 shadow-card">
        <h2 className="text-[17px] font-semibold text-ink">{variant === 'ios' ? t('install.iosTitle') : t('install.genericTitle')}</h2>
        {variant === 'ios' ? (
          <ol className="mt-4 space-y-3">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i]
              return (
                <li key={step} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-matcha/12 text-matcha">
                    <Icon size={17} />
                  </span>
                  <span className="text-[14px] text-ink">{step}</span>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="mt-3 text-[14px] leading-relaxed text-ink/70">{t('install.genericBody')}</p>
        )}
        <div className="mt-5">
          <Button fullWidth onClick={onClose}>
            {t('install.gotIt')}
          </Button>
        </div>
      </div>
    </div>
  )
}
