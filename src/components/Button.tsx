import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-matcha text-white active:bg-ink disabled:bg-matcha-light',
  secondary: 'bg-tan text-ink active:bg-matcha-light',
  ghost: 'bg-transparent text-ink border border-ink/15 active:bg-tan/60',
  danger: 'bg-red-600 text-white active:bg-red-700',
}

export function Button({ variant = 'primary', className = '', fullWidth, children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill px-5 py-3 text-[15px] font-semibold transition-colors disabled:opacity-50 ${
        variantClasses[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
