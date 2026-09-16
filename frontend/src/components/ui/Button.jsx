import { memo } from 'react'

export const Button = memo(function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
})
