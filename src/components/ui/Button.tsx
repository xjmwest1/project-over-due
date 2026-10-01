import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variantClass: Record<Variant, string> = {
  primary:
    'bg-surface-raised border border-border text-text hover:bg-white/5',
  secondary: 'bg-transparent border border-border text-muted hover:text-text',
  ghost: 'bg-transparent text-muted hover:text-text',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded-[var(--radius-card)] px-4 text-sm font-medium transition-colors disabled:opacity-40 ${variantClass[variant]} ${className}`}
      {...props}
    />
  )
}
