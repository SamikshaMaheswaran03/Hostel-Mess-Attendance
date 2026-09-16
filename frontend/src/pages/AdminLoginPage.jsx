import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getAuthStatus, getDemoCredentials, login } from '../api'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Message } from '../components/ui/Message'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [demoPassword, setDemoPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    Promise.all([getAuthStatus(), getDemoCredentials()])
      .then(([status, demo]) => {
        if (status.is_admin) navigate('/admin', { replace: true })
        setDemoPassword(demo.password)
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [navigate])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      if (!password) {
        setError('Password is required')
        return
      }
      setIsSubmitting(true)
      setError('')
      try {
        await login(password)
        navigate('/admin', { replace: true })
      } catch (err) {
        const fallback = err instanceof ApiError ? err.message : 'Network error. Please try again.'
        setError(fallback)
      } finally {
        setIsSubmitting(false)
      }
    },
    [navigate, password]
  )

  if (checking) {
    return <div className="loading">Checking…</div>
  }

  return (
    <Card className="auth-card">
      <CardHeader>
        <h1>Admin Login</h1>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} noValidate>
          <Field id="password" label="Password:" error={error}>
            <input
              id="password"
              type="password"
              value={password}
              autoFocus
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
            />
          </Field>
          <Button type="submit" loading={isSubmitting}>
            Login
          </Button>
          {demoPassword && (
            <Message text={`Demo access — password: ${demoPassword}`} type="success" />
          )}
          <Message text={error} type="error" />
        </form>
        <p className="back-link">
          <Link to="/">&larr; Back to attendance</Link>
        </p>
      </CardBody>
    </Card>
  )
}
