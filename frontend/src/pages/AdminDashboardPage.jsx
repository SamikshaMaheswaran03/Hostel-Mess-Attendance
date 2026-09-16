import { Suspense, lazy, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportUrl, logout } from '../api'
import { HistoryTable } from '../components/admin/HistoryTable'
import { MealPlanPanel } from '../components/admin/MealPlanPanel'
import { MenuManager } from '../components/admin/MenuManager'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Field } from '../components/ui/Field'

const TrendChart = lazy(() => import('../components/admin/TrendChart'))

function localDate() {
  return new Date().toISOString().slice(0, 10)
}

function ChartSkeleton() {
  return <div className="chart-skeleton" aria-label="Loading chart" />
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState(localDate)

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } finally {
      navigate('/admin/login', { replace: true })
    }
  }, [navigate])

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <h1>Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </CardHeader>
      <CardBody>
        <div className="filters">
          <Field id="dashboardDate" label="Date:">
            <input
              id="dashboardDate"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Button variant="outline" onClick={() => setDate(localDate())}>
            Today
          </Button>
          <a className="btn btn-outline" href={exportUrl('csv', date)}>
            Export CSV
          </a>
          <a className="btn btn-outline" href={exportUrl('pdf', date)}>
            Export PDF
          </a>
        </div>

        <h2>Meal Plan for {date}</h2>
        <MealPlanPanel date={date} />

        <h2>Manage Menu for {date}</h2>
        <MenuManager date={date} />

        <h2>Daily Trend (7 days)</h2>
        <Suspense fallback={<ChartSkeleton />}>
          <TrendChart days={7} />
        </Suspense>

        <h2>Attendance History</h2>
        <HistoryTable date={date} />
      </CardBody>
    </Card>
  )
}