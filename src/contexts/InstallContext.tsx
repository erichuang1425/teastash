import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallContextValue {
  isStandalone: boolean
  isIOS: boolean
  canPromptNative: boolean
  promptNativeInstall: () => Promise<void>
}

const InstallContext = createContext<InstallContextValue | null>(null)

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(detectStandalone)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = () => setIsStandalone(detectStandalone())
    mq.addEventListener?.('change', onChange)

    const onInstalled = () => setIsStandalone(true)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      mq.removeEventListener?.('change', onChange)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptNativeInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <InstallContext.Provider
      value={{
        isStandalone,
        isIOS: detectIOS(),
        canPromptNative: deferredPrompt !== null,
        promptNativeInstall,
      }}
    >
      {children}
    </InstallContext.Provider>
  )
}

export function useInstall(): InstallContextValue {
  const ctx = useContext(InstallContext)
  if (!ctx) throw new Error('useInstall must be used within InstallProvider')
  return ctx
}
