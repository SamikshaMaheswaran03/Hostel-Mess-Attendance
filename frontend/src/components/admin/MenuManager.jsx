import { useCallback, useEffect, useState } from 'react'
import { getMenu, saveMenu } from '../../api'
import { useQuery } from '../../hooks/useQuery'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Message } from '../ui/Message'

const MEAL_CONFIG = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { id: 'lunch', label: 'Lunch', icon: '🍛' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️' }
]

export function MenuManager({ date }) {
  const { data: menuData } = useQuery({
    queryKey: `menu-${date}`,
    fetcher: () => getMenu(date),
    enabled: Boolean(date)
  })

  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: 'success' })

  useEffect(() => {
    const meals = menuData?.meals
    if (meals) {
      setValues(
        Object.fromEntries(
          MEAL_CONFIG.map((meal) => [
            meal.id,
            (meals[meal.id] ?? []).join(', ')
          ])
        )
      )
    }
  }, [menuData, date])

  const handleChange = useCallback((mealId, value) => {
    setValues((prev) => ({ ...prev, [mealId]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setValues(Object.fromEntries(MEAL_CONFIG.map((meal) => [meal.id, ''])))
    setMessage({ text: '', type: 'success' })
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const meals = Object.fromEntries(
        MEAL_CONFIG.map((meal) => [meal.id, values[meal.id] || ''])
      )
      await saveMenu(date, meals)
      setMessage({ text: 'Menu saved for this date.', type: 'success' })
    } catch (err) {
      setMessage({ text: err.message || 'Failed to save menu.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }, [date, values])

  return (
    <section className="menu-manager">
      <p className="menu-hint">
        Add food items separated by commas. Empty a field to fall back to the
        default menu for that meal.
      </p>
      {MEAL_CONFIG.map((meal) => (
        <Field key={meal.id} id={`menu-${meal.id}`} label={`${meal.icon} ${meal.label}:`}>
          <input
            id={`menu-${meal.id}`}
            type="text"
            value={values[meal.id] ?? ''}
            placeholder="e.g. Idli, Dosa, Pongal"
            onChange={(event) => handleChange(meal.id, event.target.value)}
          />
        </Field>
      ))}
      <div className="menu-actions">
        <Button onClick={handleSave} loading={saving}>
          Save Menu
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to Default
        </Button>
      </div>
      <Message text={message.text} type={message.type} />
    </section>
  )
}