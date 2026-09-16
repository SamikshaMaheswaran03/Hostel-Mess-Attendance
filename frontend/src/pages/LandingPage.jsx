import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getMenu, getSummary } from '../api'
import { useQuery } from '../hooks/useQuery'

const MEAL_CONFIG = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { id: 'lunch', label: 'Lunch', icon: '🍛' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️' }
]

const FEATURES = [
  { icon: '📝', title: 'Track every meal', text: 'Mark attendance for breakfast, lunch, and dinner in seconds, and never worry about double-submitting.' },
  { icon: '🥗', title: 'Pick your plate', text: 'Choose the exact food items you want from the day\u2019s menu, so less food goes to waste.' },
  { icon: '🚫', title: 'Per-meal absence', text: 'Skipping a meal? Mark yourself absent and the kitchen knows not to prepare for you.' },
  { icon: '📊', title: 'Live meal plan', text: 'Admins see aggregated food counts plus present and absent lists as students respond.' },
  { icon: '🧾', title: 'Daily menu control', text: 'Admins edit the breakfast, lunch, and dinner menus for any date.' },
  { icon: '📈', title: 'Trends & exports', text: 'A 7-day chart plus CSV and PDF exports keep mess records simple.' }
]

const STEPS = [
  { num: '1', icon: '🆔', title: 'Enter your hostel ID', text: 'Open the mess page and type your student ID.' },
  { num: '2', icon: '🍽️', title: 'Pick a meal & status', text: 'Choose present or absent for breakfast, lunch, or dinner.' },
  { num: '3', icon: '🥙', title: 'Select your food', text: 'Tick the items you want from today\u2019s menu, or leave it empty for no preference.' },
  { num: '4', icon: '🧑\u200D🍳', title: 'Kitchen sees the plan', text: 'The admin dashboard updates live, so the mess cooks the right amount.' }
]

const NAV_LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#menu', label: "Today's menu" }
]

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, delay }
})

export function LandingPage() {
  const menu = useQuery({ queryKey: 'landing-menu', fetcher: () => getMenu() })
  const summary = useQuery({ queryKey: 'landing-summary', fetcher: () => getSummary() })
  const meals = menu.data?.meals
  const counts = summary.data?.summary

  const dateLabel = menu.data?.date
    ? new Date(`${menu.data.date}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link className="landing-brand" to="/">
          🏠 Hostel Mess
        </Link>
        <nav className="landing-nav-links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="landing-nav-actions">
          <Link className="btn btn-outline" to="/admin/login">
            Admin Login
          </Link>
          <Link className="btn btn-primary" to="/app">
            Track my meal
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Less waste. <span className="landing-hero-accent">Everyone fed.</span>
        </motion.h1>
        <motion.p
          className="landing-hero-sub"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
        >
          Hostel Mess Attendance lets students mark their meals and pick the food they
          actually want, so the kitchen prepares just the right amount.
        </motion.p>
        <motion.div
          className="landing-hero-actions"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
        >
          <Link className="btn btn-primary landing-hero-btn" to="/app">
            Track my meal
          </Link>
          <Link className="btn btn-outline landing-hero-btn" to="/admin/login">
            Admin dashboard
          </Link>
        </motion.div>
        <motion.a
          className="landing-scroll-hint"
          href="#how"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span className="landing-scroll-dot" aria-hidden="true" />
          Scroll to explore
        </motion.a>
      </section>

      <section id="how" className="landing-section">
        <motion.h2 {...reveal()}>How it works</motion.h2>
        <motion.p className="landing-section-sub" {...reveal(0.08)}>
          Four quick steps from student ID to a full meal plan.
        </motion.p>
        <div className="landing-grid landing-steps">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.num}
              className="landing-card landing-step"
              {...reveal(i * 0.08)}
            >
              <span className="landing-step-num">{step.num}</span>
              <span className="landing-step-icon" aria-hidden="true">
                {step.icon}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section landing-section-alt">
        <motion.h2 {...reveal()}>Why students love it</motion.h2>
        <motion.p className="landing-section-sub" {...reveal(0.08)}>
          Built for hostels, tuned for zero waste.
        </motion.p>
        <div className="landing-grid landing-features">
          {FEATURES.map((feature, i) => (
            <motion.article
              key={feature.title}
              className="landing-card"
              {...reveal((i % 3) * 0.08)}
            >
              <span className="landing-feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="menu" className="landing-section">
        <motion.h2 {...reveal()}>Today's menu</motion.h2>
        <motion.p className="landing-section-sub" {...reveal(0.08)}>
          {dateLabel || 'Live from the mess kitchen'}
        </motion.p>
        <div className="landing-menu">
          {MEAL_CONFIG.map((meal, i) => {
            const items = meals?.[meal.id] || []
            const count = counts?.[meal.id] ?? null
            return (
              <motion.article key={meal.id} className="landing-card landing-menu-meal" {...reveal(i * 0.08)}>
                <div className="landing-menu-head">
                  <span className="landing-menu-icon" aria-hidden="true">
                    {meal.icon}
                  </span>
                  <h3>{meal.label}</h3>
                  {count !== null && (
                    <span className="landing-menu-count">{count} marking</span>
                  )}
                </div>
                {items.length > 0 ? (
                  <ul className="landing-menu-items">
                    {items.map((item) => (
                      <li key={item} className="food-chip food-chip-static">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="landing-menu-empty">Menu not published yet.</p>
                )}
              </motion.article>
            )
          })}
        </div>
      </section>

      <section className="landing-cta">
        <motion.h2 {...reveal()}>Ready to mark your meal?</motion.h2>
        <motion.div className="landing-hero-actions" {...reveal(0.1)}>
          <Link className="btn btn-primary landing-hero-btn" to="/app">
            Get started
          </Link>
          <Link className="btn btn-outline landing-hero-btn" to="/admin/login">
            Admin Login
          </Link>
        </motion.div>
      </section>

      <footer className="landing-footer">
        <span>🏠 Hostel Mess Attendance</span>
        <span className="landing-footer-links">
          <Link to="/app">Student page</Link>
          <Link to="/admin/login">Admin</Link>
        </span>
      </footer>
    </div>
  )
}