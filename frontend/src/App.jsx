import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin } from './components/admin/RequireAdmin'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { AttendanceProvider } from './context/AttendanceContext'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { LandingPage } from './pages/LandingPage'
import { StudentPage } from './pages/StudentPage'

export default function App() {
  return (
    <ErrorBoundary>
      <AttendanceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<StudentPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboardPage />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AttendanceProvider>
    </ErrorBoundary>
  )
}
