import { useCallback, useState } from 'react'
import { useAttendance } from '../../context/AttendanceContext'
import { ApiError, getMenu } from '../../api'
import { useQuery } from '../../hooks/useQuery'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Message } from '../ui/Message'
import { Tab, Tabs } from '../ui/Tabs'
import { FoodSelector } from './FoodSelector'

const MEALS = [
  { id: 'breakfast', label: '🍳 Breakfast' },
  { id: 'lunch', label: '🍛 Lunch' },
  { id: 'dinner', label: '🍽️ Dinner' }
]

const STATUS_OPTIONS = [
  { id: 'present', label: '🍴 I am attending' },
  { id: 'absent', label: '🚫 I am absent' }
]

function validate(studentId, meal) {
  const errors = {}
  if (!studentId.trim()) {
    errors.studentId = 'Student ID is required'
  } else if (studentId.length > 30) {
    errors.studentId = 'Student ID must be 30 characters or fewer'
  }
  if (!meal) {
    errors.meal = 'Select a meal'
  }
  return errors
}

export function AttendanceForm() {
  const { markAttendance } = useAttendance()
  const [studentId, setStudentId] = useState('')
  const [meal, setMeal] = useState('')
  const [status, setStatus] = useState('present')
  const [foods, setFoods] = useState([])
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState({ text: '', type: 'success' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: menuData } = useQuery({
    queryKey: `menu-${meal}`,
    fetcher: () => getMenu(),
    enabled: Boolean(meal)
  })
  const foodItems = meal ? menuData?.meals?.[meal] ?? [] : []

  const handleMealChange = useCallback((next) => {
    setMeal(next)
    setFoods([])
    setErrors((prev) => ({ ...prev, meal: undefined }))
  }, [])

  const handleStatusChange = useCallback((next) => {
    setStatus(next)
    if (next === 'absent') setFoods([])
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      const nextErrors = validate(studentId, meal)
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return

      setIsSubmitting(true)
      try {
        const data = await markAttendance(studentId, meal, {
          status,
          foods: status === 'absent' ? [] : foods
        })
        setMessage({ text: data.message, type: 'success' })
        setStudentId('')
        setMeal('')
        setStatus('present')
        setFoods([])
        setErrors({})
      } catch (err) {
        const fallback = err instanceof ApiError ? err.message : 'Network error. Please try again.'
        setMessage({ text: fallback, type: 'error' })
      } finally {
        setIsSubmitting(false)
      }
    },
    [markAttendance, meal, studentId, status, foods]
  )

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field id="studentId" label="Student ID:" error={errors.studentId}>
        <input
          id="studentId"
          type="text"
          value={studentId}
          placeholder="Enter your ID"
          maxLength={30}
          onChange={(e) => {
            setStudentId(e.target.value)
            setErrors((prev) => ({ ...prev, studentId: undefined }))
          }}
        />
      </Field>

      <div className="field">
        <span className="field-label">Select Meal:</span>
        <Tabs value={meal} onChange={handleMealChange} label="Select a meal">
          {MEALS.map((m) => (
            <Tab key={m.id} id={m.id}>
              {m.label}
            </Tab>
          ))}
        </Tabs>
        {errors.meal && <span className="field-error">{errors.meal}</span>}
      </div>

      <div className="field">
        <span className="field-label">Attendance:</span>
        <div className="status-toggle">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`status-option${status === option.id ? ' active' : ''}`}
              aria-pressed={status === option.id}
              onClick={() => handleStatusChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {status === 'present' && meal && (
        <FoodSelector
          items={foodItems}
          value={foods}
          onChange={setFoods}
          disabled={isSubmitting}
        />
      )}

      <Button type="submit" loading={isSubmitting}>
        {status === 'absent' ? 'Mark Absent' : 'Mark Attendance'}
      </Button>

      <Message text={message.text} type={message.type} />
    </form>
  )
}