import { useEffect } from 'react'

const MEAL_WINDOWS = [
  { label: 'Breakfast', start: 7, end: 9 },
  { label: 'Lunch', start: 12, end: 14 },
  { label: 'Dinner', start: 19, end: 21 }
]

function supported() {
  return 'Notification' in window
}

/**
 * Requests notification permission and fires a reminder at the start of each
 * meal window. Pure client-side; depends on the tab being open.
 */
export function useMealReminders() {
  useEffect(() => {
    if (!supported()) return undefined

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    let remindedForDay = null

    const check = () => {
      if (Notification.permission !== 'granted') return
      const now = new Date()
      const dayKey = now.toDateString()
      if (remindedForDay === dayKey) return

      const hour = now.getHours()
      const minute = now.getMinutes()
      const due = MEAL_WINDOWS.find((w) => hour === w.start && minute < 15)
      if (due) {
        new Notification('Meal reminder', {
          body: `${due.label} attendance is open. Mark it now!`
        })
        remindedForDay = dayKey
      }
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])
}
