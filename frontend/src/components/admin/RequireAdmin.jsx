import { Navigate } from 'react-router-dom'
import { getAuthStatus } from '../../api'
import { useQuery } from '../../hooks/useQuery'

export function RequireAdmin({ children }) {
  const { data, loading, error } = useQuery({
    queryKey: 'auth-status',
    fetcher: () => getAuthStatus(),
    refetchInterval: 60_000
  })

  if (loading) {
    return <div className="loading">Checking access…</div>
  }

  if (error || !data?.is_admin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
