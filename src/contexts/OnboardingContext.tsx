import { createContext, useContext, useState, type ReactNode } from 'react'
import { loadHasCompletedOnboarding, saveHasCompletedOnboarding } from '../lib/settingsStorage'

interface OnboardingContextValue {
  isTourOpen: boolean
  completeTour: () => void
  restartTour: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isTourOpen, setIsTourOpen] = useState(() => !loadHasCompletedOnboarding())

  const completeTour = () => {
    saveHasCompletedOnboarding(true)
    setIsTourOpen(false)
  }

  const restartTour = () => {
    setIsTourOpen(true)
  }

  return (
    <OnboardingContext.Provider value={{ isTourOpen, completeTour, restartTour }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
