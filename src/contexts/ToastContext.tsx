import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { ToastViewport, type ToastItem } from '../components/Toast'
import { createId } from '../lib/id'

interface ToastAction {
  label: string
  onAction: () => void
}

interface ToastContextValue {
  showToast: (message: string, action?: ToastAction) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const PLAIN_DURATION_MS = 2600
const ACTION_DURATION_MS = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const actionsRef = useRef(new Map<string, () => void>())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) clearTimeout(timer)
    timersRef.current.delete(id)
    actionsRef.current.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, action?: ToastAction) => {
      const id = createId()
      if (action) actionsRef.current.set(id, action.onAction)
      setToasts((prev) => [...prev, { id, message, actionLabel: action?.label }])
      const timer = setTimeout(() => dismiss(id), action ? ACTION_DURATION_MS : PLAIN_DURATION_MS)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  const handleActionClick = useCallback(
    (id: string) => {
      const action = actionsRef.current.get(id)
      dismiss(id)
      action?.()
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastViewport toasts={toasts} onActionClick={handleActionClick} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
