export interface ToastItem {
  id: string
  message: string
  actionLabel?: string
}

interface ToastViewportProps {
  toasts: ToastItem[]
  onActionClick: (id: string) => void
}

export function ToastViewport({ toasts, onActionClick }: ToastViewportProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-safe-nav pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-up pointer-events-auto flex max-w-sm items-center gap-3 rounded-pill bg-ink px-5 py-3 text-sm font-medium text-cream shadow-card"
        >
          <span>{toast.message}</span>
          {toast.actionLabel && (
            <button
              type="button"
              onClick={() => onActionClick(toast.id)}
              className="-my-1 -mr-2 min-h-[36px] shrink-0 rounded-pill px-3 font-bold text-matcha-light"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
