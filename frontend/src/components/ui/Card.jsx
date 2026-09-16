import { memo } from 'react'

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  )
}

export const CardHeader = memo(function CardHeader({ children, ...props }) {
  return (
    <div className="card-header" {...props}>
      {children}
    </div>
  )
})

export const CardBody = memo(function CardBody({ children, ...props }) {
  return (
    <div className="card-body" {...props}>
      {children}
    </div>
  )
})
