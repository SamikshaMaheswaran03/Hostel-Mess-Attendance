import { memo, useCallback } from 'react'

export const FoodSelector = memo(function FoodSelector({ items, value, onChange, disabled }) {
  const toggle = useCallback(
    (item) => {
      const next = value.includes(item)
        ? value.filter((food) => food !== item)
        : [...value, item]
      onChange(next)
    },
    [value, onChange]
  )

  if (!items.length) return null

  return (
    <div className="field food-selector">
      <span className="field-label">Select your food (optional):</span>
      <div className="food-grid">
        {items.map((item) => (
          <label
            key={item}
            className={`food-chip${value.includes(item) ? ' selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={value.includes(item)}
              disabled={disabled}
              onChange={() => toggle(item)}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
      <span className="field-hint">
        Leave it empty for &ldquo;no preference&rdquo;.
      </span>
    </div>
  )
})