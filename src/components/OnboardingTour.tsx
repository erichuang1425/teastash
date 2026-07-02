import { useState } from 'react'
import { Leaf, CalendarClock, Scale, Bell, Download } from 'lucide-react'
import { useI18n } from '../i18n'
import { useOnboarding } from '../contexts/OnboardingContext'
import { Button } from './Button'

const STEPS = [
  { icon: Leaf, titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Body' },
  { icon: CalendarClock, titleKey: 'onboarding.step2Title', bodyKey: 'onboarding.step2Body' },
  { icon: Scale, titleKey: 'onboarding.step3Title', bodyKey: 'onboarding.step3Body' },
  { icon: Bell, titleKey: 'onboarding.step4Title', bodyKey: 'onboarding.step4Body' },
  { icon: Download, titleKey: 'onboarding.step5Title', bodyKey: 'onboarding.step5Body' },
] as const

export function OnboardingTour() {
  const { isTourOpen, completeTour } = useOnboarding()
  const { t } = useI18n()
  const [stepIndex, setStepIndex] = useState(0)

  if (!isTourOpen) return null

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1
  const Icon = step.icon

  const handleFinish = () => {
    setStepIndex(0)
    completeTour()
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/50 px-4 pb-8 animate-fade-in sm:items-center">
      <div className="w-full max-w-sm animate-slide-up rounded-card bg-white p-6 shadow-card">
        <div className="flex justify-end">
          <button type="button" onClick={handleFinish} className="text-[13.5px] font-medium text-ink/40">
            {t('onboarding.skip')}
          </button>
        </div>

        <div className="mx-auto mt-1 flex h-16 w-16 items-center justify-center rounded-full bg-matcha/12 text-matcha">
          <Icon size={30} strokeWidth={1.75} />
        </div>

        <h2 className="mt-4 text-center text-[18px] font-bold text-ink">{t(step.titleKey)}</h2>
        <p className="mt-2 text-center text-[14px] leading-relaxed text-ink/60">{t(step.bodyKey)}</p>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.titleKey}
              className={`h-1.5 rounded-full transition-all ${i === stepIndex ? 'w-5 bg-matcha' : 'w-1.5 bg-ink/15'}`}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {stepIndex > 0 && (
            <Button variant="ghost" fullWidth onClick={() => setStepIndex((i) => i - 1)}>
              {t('onboarding.back')}
            </Button>
          )}
          <Button
            fullWidth
            onClick={() => {
              if (isLast) handleFinish()
              else setStepIndex((i) => i + 1)
            }}
          >
            {isLast ? t('onboarding.finish') : t('onboarding.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
