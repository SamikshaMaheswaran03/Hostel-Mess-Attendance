import { useState } from 'react'
import { Button } from '../ui/Button'

export function ReminderCard() {
  const [permission, setPermission] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  )

  const enable = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  if (permission === 'unsupported') return null

  return (
    <div className="reminder-card">
      {permission === 'granted' ? (
        <span>🔔 Meal reminders are on</span>
      ) : (
        <>
          <span>🔔 Get a reminder when meal attendance opens</span>
          <Button type="button" variant="outline" onClick={enable}>
            Enable notifications
          </Button>
        </>
      )}
    </div>
  )
}
