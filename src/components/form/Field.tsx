import type { ReactNode } from 'react'
import { useI18n } from '../../i18n'

export const inputClass =
  'w-full min-h-[44px] rounded-2xl border border-ink/12 bg-cream/60 px-4 py-2.5 text-[16px] text-ink placeholder:text-ink/35 focus:border-matcha focus:outline-none focus:ring-2 focus:ring-matcha/20'

interface FieldProps {
  label: string
  error?: string
  optional?: boolean
  children: ReactNode
  htmlFor?: string
}

export function Field({ label, error, optional, children, htmlFor }: FieldProps) {
  const { t } = useI18n()
  return (
    <div className="block">
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-ink/70">
        {label}
        {optional && <span className="text-ink/40">({t('common.optional')})</span>}
      </label>
      {children}
      {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
    </div>
  )
}
