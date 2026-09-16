import { createContext, useCallback, useContext, useEffect, useRef } from 'react'

const TabsContext = createContext(undefined)

/**
 * Compound tabs with keyboard navigation (ArrowLeft / ArrowRight), focus
 * management, and ARIA roles. Controlled: pass `value` and `onChange`.
 */
export function Tabs({ value, onChange, label, children }) {
  const tabRefs = useRef({})

  const registerTab = useCallback((id, node) => {
    tabRefs.current[id] = node
  }, [])

  const handleKeyDown = (event) => {
    const ids = Object.keys(tabRefs.current)
    if (ids.length === 0) return
    const index = ids.indexOf(value)
    let next = null

    if (event.key === 'ArrowRight') {
      next = ids[(index + 1) % ids.length]
    } else if (event.key === 'ArrowLeft') {
      next = ids[(index - 1 + ids.length) % ids.length]
    }

    if (next) {
      event.preventDefault()
      onChange(next)
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <TabsContext.Provider value={{ activeTab: value, setActiveTab: onChange, registerTab }}>
      <div
        className="tabs"
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function Tab({ id, children }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')
  const { activeTab, setActiveTab, registerTab } = context

  const ref = useRef(null)
  useEffect(() => {
    registerTab(id, ref.current)
  }, [id, registerTab])

  const isActive = activeTab === id

  return (
    <button
      ref={ref}
      id={`tab-${id}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      tabIndex={isActive ? 0 : -1}
      className={`tab${isActive ? ' active' : ''}`}
      onClick={() => setActiveTab(id)}
      type="button"
    >
      {children}
    </button>
  )
}
