const BASE = '/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Admin login required.') {
    super(message, 401)
    this.name = 'AuthError'
  }
}

async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(BASE + path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }

  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  })

  if (res.status === 401) {
    throw new AuthError()
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    // Non-JSON response (e.g. CSV/PDF) handled by callers directly.
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status}).`, res.status)
  }
  return data
}

export const markAttendance = (studentId, meal, { status = 'present', foods = [] } = {}) =>
  request('/attendance', {
    method: 'POST',
    body: { student_id: studentId, meal, status, foods }
  })

export const getMenu = (date) => request('/menu', { params: { date } })

export const saveMenu = (date, meals) =>
  request('/menu', { method: 'POST', body: { date, meals } })

export const getMealPlan = (date) => request('/meal-plan', { params: { date } })

export const getSummary = () => request('/summary')

export const getAuthStatus = () => request('/auth/status')

export const getDemoCredentials = () => request('/auth/demo')

export const login = (password) =>
  request('/admin/login', { method: 'POST', body: { password } })

export const logout = () => request('/admin/logout', { method: 'POST' })

export const getHistory = (date) => request('/history', { params: { date } })

export const getStats = (days) => request('/stats', { params: { days } })

export const exportUrl = (kind, date) => `${BASE}/export.${kind}?date=${date}`
