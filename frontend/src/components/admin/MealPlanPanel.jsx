import { memo } from 'react'
import { getMealPlan } from '../../api'
import { useQuery } from '../../hooks/useQuery'

const MEAL_CONFIG = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { id: 'lunch', label: 'Lunch', icon: '🍛' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️' }
]

export function MealPlanPanel({ date }) {
  const { data, loading } = useQuery({
    queryKey: `meal-plan-${date}`,
    fetcher: () => getMealPlan(date),
    refetchInterval: 5000
  })

  const meals = data?.meals ?? null

  if (loading && !meals) {
    return <div className="loading">Loading meal plan…</div>
  }

  if (!meals) {
    return <p className="empty">No meal plan available for this date.</p>
  }

  return (
    <section className="meal-plan">
      {MEAL_CONFIG.map((meal) => (
        <MealPlanCard key={meal.id} meal={meal} plan={meals[meal.id] || {}} />
      ))}
    </section>
  )
}

const MealPlanCard = memo(function MealPlanCard({ meal, plan }) {
  const counts = plan.counts ?? {}
  const present = plan.present ?? []
  const absent = plan.absent ?? []

  return (
    <article className="meal-plan-card">
      <header className="meal-plan-header">
        <h3>
          {meal.icon} {meal.label}
        </h3>
        <div className="meal-plan-stats">
          <span className="stat stat-present">{plan.present_count ?? 0} attending</span>
          <span className="stat stat-absent">{plan.absent_count ?? 0} absent</span>
          {plan.no_selection_count > 0 && (
            <span className="stat stat-noselect">{plan.no_selection_count} no preference</span>
          )}
        </div>
      </header>

      {Object.keys(counts).length > 0 ? (
        <ul className="food-counts">
          {Object.entries(counts).map(([food, count]) => (
            <li key={food} className="food-count">
              <span className="food-count-name">{food}</span>
              <span className="food-count-value">{count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">No menu items set for this meal.</p>
      )}

      {present.length > 0 && (
        <table className="plan-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Foods</th>
            </tr>
          </thead>
          <tbody>
            {present.map((row) => (
              <tr key={row.student_id}>
                <td>{row.student_id}</td>
                <td>{row.foods.length > 0 ? row.foods.join(', ') : <em>No preference</em>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {absent.length > 0 && (
        <p className="absent-note">
          <strong>Absent:</strong> {absent.join(', ')}
        </p>
      )}
    </article>
  )
})