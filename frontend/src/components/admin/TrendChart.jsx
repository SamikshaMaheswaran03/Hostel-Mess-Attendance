import { useEffect, useMemo, useRef } from 'react'
import Chart from 'chart.js/auto'
import { getStats } from '../../api'
import { useQuery } from '../../hooks/useQuery'

const MEAL_CONFIG = [
  { id: 'breakfast', label: 'Breakfast', color: '#4CAF50' },
  { id: 'lunch', label: 'Lunch', color: '#ff9800' },
  { id: 'dinner', label: 'Dinner', color: '#7c3aed' }
]

export default function TrendChart({ days = 7 }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  const { data } = useQuery({
    queryKey: `stats-${days}`,
    fetcher: () => getStats(days)
  })

  const labels = useMemo(() => data?.series.map((row) => row.date) ?? [], [data])
  const datasets = useMemo(
    () =>
      MEAL_CONFIG.map((meal) => ({
        label: meal.label,
        data: data?.series.map((row) => row[meal.id]) ?? [],
        backgroundColor: meal.color,
        borderColor: meal.color,
        borderWidth: 1
      })),
    [data]
  )

  useEffect(() => {
    if (!canvasRef.current) return undefined
    const chart = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    })
    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [labels, datasets])

  return (
    <div className="chart-wrap">
      <canvas ref={canvasRef} role="img" aria-label="Daily meal attendance trend" />
    </div>
  )
}
