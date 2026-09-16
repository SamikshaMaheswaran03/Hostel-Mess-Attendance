import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAttendance } from '../../context/AttendanceContext'
import { Card, CardBody, CardHeader } from '../ui/Card'

const MEAL_CONFIG = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { id: 'lunch', label: 'Lunch', icon: '🍛' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️' }
]

export function SummaryCard() {
  const { summary } = useAttendance()
  const total = MEAL_CONFIG.reduce((sum, meal) => sum + (summary[meal.id] || 0), 0)

  return (
    <Card>
      <CardHeader>
        <h2>Meal Attendance Summary</h2>
        <span className="summary-total">{total} total</span>
      </CardHeader>
      <CardBody>
        <ul className="summary-list">
          {MEAL_CONFIG.map((meal) => (
            <SummaryRow key={meal.id} meal={meal} count={summary[meal.id] || 0} />
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

const SummaryRow = memo(function SummaryRow({ meal, count }) {
  return (
    <li className="summary-row">
      <span className="summary-icon">{meal.icon}</span>
      <span className="summary-label">{meal.label}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={count}
          className="summary-count"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </li>
  )
})
