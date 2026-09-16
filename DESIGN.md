# Design

## Source of truth

- **Status**: Active
- **Date**: 2026-09-16
- **Product surfaces**: landing page (`/`), student mess page (`/app`), admin login (`/admin/login`), admin dashboard (`/admin`)
- **Evidence reviewed**:
  - `README.md` (features, tech stack, data model, API reference)
  - `frontend/src/styles.css` (CSS custom properties, card/button tokens, animated gradient)
  - `frontend/src/App.jsx` (route map)
  - `frontend/src/pages/*` and `frontend/src/components/{student,admin,ui}/*` (page/component inventory)
  - `frontend/package.json` (React 18, Vite, react-router-dom, framer-motion, Chart.js)
  - `frontend/index.html` (document title/meta)

This file is the durable design contract. UI decisions must cite it rather than invent a parallel design layer.

## Brand

- **Personality**: warm, trustworthy, campus-native. Feels like a friendly college mess app, not enterprise software.
- **Trust signals**: clear live counts, duplicate-marking protection, admin-only management, calm pastel gradient + green primary accent.
- **Avoid**: dense dashboards on the public surfaces, harsh colors, jargon, fake urgency.

## Product goals

- **Goals**
  - Let students mark per-meal attendance (breakfast/lunch/dinner) fast and correct it before the count locks.
  - Let students pick exact food items so the mess cooks the right quantity and cuts waste.
  - Let students mark a meal absent so admins do not prepare for them.
  - Give admins a live, per-day meal plan, history, trends, and exports.
- **Non-goals**: payments, inventory management, multi-campus tooling, gamification.
- **Success signals**: low duplicate-mark friction, reduced leftover waste, admins trusting live counts for prep.

## Personas and jobs

- **Student (primary fame surface)** — job: mark attendance + food picks in under 30 seconds on a phone, then verify their day's summary. Context: standing in a hostel corridor, off-campus lecture, low attention, possibly slow network.
- **Mess/Admin staff (primary dashboard surface)** — job: see how many plates to prepare per meal, which foods to cook more/less of, who is absent, and export a record. Context: desktop or phone, needs current-day numbers at a glance.
- **Visitor reviewing the product (landing surface)** — job: understand what the app does in one scroll and click into the student flow.

## Information architecture

- **Navigation (top-level routes)**
  - `/` — Landing page: hero, features, how it works, today's menu snapshot, CTA.
  - `/app` — Student mess page: attendance form, reminder card, summary card. Replaces former `/`.
  - `/admin/login` — Admin password login.
  - `/admin` — Admin dashboard: date picker, live meal plan, 7-day chart, history, menu manager.
- **Content hierarchy on landing**: Hero → How it works → Features → Today's menu → CTA + footer. Nav anchors scroll to sections.
- The student entry path should be reachable with one click (`/app`) from the landing hero.

## Design principles

- **Fast by default**: primary student task is 2 taps (meal) + optional chips + submit.
- **State of the day, not the app**: the date is the anchor; everything is framed per meal per day.
- **Reduce waste**: absence and food picks are first-class, not footnotes.
- **Motion aids, never delays**: animations reveal content; `prefers-reduced-motion` disables them.
- **Consistent tokens**: every surface reuses the same color/spacing/radius tokens.

## Visual language

- **Color** (from `styles.css`)
  - `--primary: #4CAF50`, `--primary-dark: #388e3c` (safe/green actions).
  - `--accent: #7c3aed`, `--border: #4c07e1` (links, outlines, focus).
  - `--danger: #d32f2f` (absent/errors), `--text: #333`, `--muted: #666`.
  - Background: animated pastel gradient `linear-gradient(-45deg, #74ebd5, #9face6, #fbc2eb, #a6c1ee)`, `background-size 400% 400%`, 12s loop.
- **Typography**: `'Segoe UI', system-ui, sans-serif`. App h1/h2 centered at ~1.4em; landing uses larger display sizes with the same family.
- **Spacing**: consistent 12–28px padding (cards use 24–28px gutters).
- **Shape/elevation**: cards `border-radius: 32px` on the student card, `--radius: 12px` for inputs/buttons; soft `0 6px 20px rgba(0,0,0,.2)` shadows.
- **Motion**: gradient drift (12s), framer-motion message/count animations, landing `whileInView` reveals, smooth anchor scrolling.
- **Imagery/iconography**: no image assets; use emoji sparingly for food categories and simple inline SVG for nav/brand marks.

## Components

- Existing: `Card`/`CardHeader`/`CardBody` (compound, `.card`, `.dashboard-card`), `Tabs`, `AttendanceForm`, `FoodSelector`, `ReminderCard`, `SummaryCard`, `MealPlanPanel`, `TrendChart` (lazy Chart.js), `HistoryTable`, `MenuManager`, `StatusBadge`, buttons (`.btn`, `.btn-primary`, `.btn-outline`, `.btn-link`).
- New (landing): `LandingPage` with header/nav, hero, feature grid, steps, menu snapshot, CTA band, footer. Landing composes existing `Card` styling but is its own layout; it must not stretch the 520px `.card` max-width.
- Token ownership: `styles.css` `:root` is the single source for colors/radius. Landing classes use `var(--…)` plus a `landing-*` namespace.

## Accessibility

- Target: WCAG 2.1 AA contrast; green/red statuses are paired with text labels (Present/Absent), never color alone.
- Keyboard: all nav links, tabs, and buttons focusable; visible focus ring using `--accent`.
- Semantics: anchor-scroll links map to real section landmarks; form inputs have explicit labels; buttons are `button` elements.
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables the background gradient drift, scroll smoothness, and reveal animations.

## Responsive behavior

- Breakpoints: single content column up to ~640px (existing mobile rules), wider >640px.
- Landing: nav collapses to a compact row; hero text scales down; feature grid stacks; CTA buttons wrap.
- Student/app page: card stays centered with `max-width: 520px`; admin dashboard `max-width: 860px`.
- Touch: chips and status toggles are ≥ 40px hit targets; hover only enhances, never required.

## Interaction states

- Loading: skeleton/spinner on summary and meal-plan polls; landing data cards show subtle loading to avoid layout shift.
- Empty: no records -> "No meals marked yet" with hint; no preference chips -> students may submit with none.
- Error: inline error text with `--danger`; API 400/409/401 surfaced as readable messages.
- Success: toast/badge confirmation after submit (framer-motion); counted values update.
- Disabled: submit disabled while in-flight or when duplicate already marked.
- Offline/slow network: polls (`useQuery`) degrade gracefully; landing snapshot is non-blocking.

## Content voice

- Tone: friendly and direct; campus voice ("mark your meal", "pick your plate").
- Terminology: meals are `breakfast`, `lunch`, `dinner`; roles are `student` and `admin`; states are `present`/`absent`.
- Microcopy rules: actions are verbs ("Track my meal", "Save menu"); errors state what to fix, not blame.

## Implementation constraints

- Frontend: React 18 + Vite SPA in `frontend/`, built to `frontend/dist` and served by Flask. Do not add new runtime dependencies unless required (framer-motion and react-router-dom already available).
- Backend: Flask JSON API; no backend changes required for the landing page (it uses existing `GET /api/menu` and `GET /api/summary`).
- Route change: `/` becomes the landing page; the student page moves to `/app`. Update internal links accordingly.
- Performance: landing stays code-split-light; live data uses existing hooks with polling only on the student/admin surfaces.
- Compatibility: modern evergreen browsers; `scroll-behavior: smooth` is progressive (no-op fallback).
- Test/screenshot expectations: `npm run build` must pass; no Playwright baselines tracked.

## Open questions

- [ ] Should the landing "today's menu" card show live counts from `/api/summary` or stay static? Owner: build. Impact: small request volume on the public route.
- [ ] Future: allow times for meals (open/close windows) shown on landing? Owner: product. Impact: new API/UI work, out of current scope.