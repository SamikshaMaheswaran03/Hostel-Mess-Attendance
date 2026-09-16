import { Link } from 'react-router-dom'
import { AttendanceForm } from '../components/student/AttendanceForm'
import { ReminderCard } from '../components/student/ReminderCard'
import { SummaryCard } from '../components/student/SummaryCard'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { useMealReminders } from '../hooks/useMealReminders'

export function StudentPage() {
  useMealReminders()

  return (
    <Card className="student-card">
      <CardHeader>
        <h1>Hostel Mess Attendance</h1>
        <Link className="btn btn-link" to="/admin/login">
          Admin Login
        </Link>
      </CardHeader>
      <CardBody>
        <AttendanceForm />
        <ReminderCard />
        <SummaryCard />
      </CardBody>
    </Card>
  )
}
