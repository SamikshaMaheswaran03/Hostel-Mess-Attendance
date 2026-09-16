import { memo } from 'react'
import { getHistory } from '../../api'
import { useQuery } from '../../hooks/useQuery'

const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

function localDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

export function HistoryTable({ date }) {
  const { data, loading } = useQuery({
    queryKey: `history-${date}`,
    fetcher: () => getHistory(date)
  })

  const records = data?.records ?? []

  return (
    <section className="history">
      {loading ? (
        <div className="loading">Loading history…</div>
      ) : records.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Meal</th>
              <th>Status</th>
              <th>Foods</th>
              <th>Marked at</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <HistoryRow key={`${record.student_id}-${record.meal}`} record={record} />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">No attendance recorded for this date.</p>
      )}
    </section>
  )
}

const HistoryRow = memo(function HistoryRow({ record }) {
  const isAbsent = record.status === 'absent'
  return (
    <tr className={isAbsent ? 'row-absent' : undefined}>
      <td>{record.student_id}</td>
      <td>{MEAL_LABELS[record.meal] || record.meal}</td>
      <td>{isAbsent ? 'Absent' : 'Attending'}</td>
      <td>{isAbsent ? '—' : (record.foods?.length > 0 ? record.foods.join(', ') : <em>No preference</em>)}</td>
      <td>{formatTime(record.marked_at)}</td>
    </tr>
  )
})
