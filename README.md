# 🏠 Hostel Mess Attendance

A full-stack web app for tracking student meal attendance and food preferences. Students mark whether they will attend breakfast, lunch, or dinner each day, pick the food items they want (to cut food waste), or mark themselves absent per meal. Admins get a live meal-plan summary, daily history, charts, and CSV/PDF exports.

---

## ✨ Features

- ✅ **Meal attendance tracking** for breakfast, lunch, and dinner
- 🔒 **Duplicate marking prevented** per student, meal, and day
- 🍽️ **Per-day food menus** that admins can edit for each meal
- 🥘 **Food selection**: students pick the items they want per meal (or leave it empty for "no preference")
- 🚫 **Per-meal absence marking** so admins know not to prepare for absent students
- 📊 **Live meal plan** on the admin dashboard (auto-refreshes every 5 seconds) with aggregated food counts, present/absent lists, and per-student selections
- 📈 **7-day trend chart** using Chart.js (admin)
- 🧾 **CSV and PDF export** for any date (admin)
- 🔔 **Meal reminders** via browser notifications
- 🔐 **Admin dashboard** protected by a password
- 🎨 **Modern UI** with animated gradient background, fully responsive

---

## 🧰 Tech Stack

**Frontend (React SPA)**
- **React 18 + Vite** — built with the `frontend-patterns` skillset: component composition, compound components (`Tabs`), custom hooks (`useQuery`, `useToggle`), context + reducer state, controlled forms with validation, error boundary, lazy-loaded chart, memoization, framer-motion animations, and accessible keyboard navigation.
- **react-router-dom** — routing for `/` (landing), `/app` (student page), `/admin`, `/admin/login`
- **Chart.js** — trend graphs (lazy-loaded code-split chunk)
- **framer-motion** — message and count animations

**Backend (Flask)**
- **Python + Flask** — JSON API and admin sessions
- **Firebase Firestore** — cloud database (`firebase-admin`)
- **fpdf2** — PDF export

---

## 🗄️ Data Model (Firestore)

Collection `attendance`:

| Field | Type | Notes |
| --- | --- | --- |
| `student_id` | string | e.g. `2024CS001` |
| `meal` | string | `breakfast`, `lunch`, or `dinner` |
| `date` | string | `YYYY-MM-DD` |
| `marked_at` | timestamp | server time when recorded |
| `status` | string | `present` (default) or `absent` |
| `foods` | array | selected food item names; empty for absent or no preference |

Document ID is `{student_id}_{meal}_{date}`, which makes duplicate marking idempotent.

Collection `menus`: document ID is the date (`YYYY-MM-DD`). Fields are `breakfast`, `lunch`, `dinner`, each an array of food item names. Missing date/document falls back to the `DEFAULT_MENU` in the backend.

Collection `students` (optional, when `STUDENT_REGISTRY=1`): document ID is the student ID. Only registered IDs can mark attendance.

---

## 🚀 Setup (Local)

### 1. Backend

```bash
pip install -r requirements.txt
```

Create a Firebase project at https://console.firebase.google.com, enable **Firestore**, and in **Project settings → Service accounts** generate a private key. Save it as `service-account.json` in the project root, then:

```bash
copy .env.example .env
```

Edit `.env`:

```ini
PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS=service-account.json
ADMIN_PASSWORD=your-admin-password
FLASK_SECRET_KEY=a-long-random-string
TZ=Asia/Kolkata   # optional
STUDENT_REGISTRY=1
```

### 2. Frontend

```bash
cd frontend
npm install
npm run build    # outputs to frontend/dist, served by Flask
```

### 3. Run

```bash
python app.py
```

- Landing page: http://localhost:5000
- Student mess page: http://localhost:5000/app
- Admin dashboard: http://localhost:5000/admin

For frontend development with hot reload, run Flask and Vite together:

```bash
# terminal 1
python app.py

# terminal 2
cd frontend && npm run dev   # http://localhost:5173, proxies /api to Flask
```

---

## 🔧 How It Works

1. A student enters their hostel ID, picks a meal via tabs, chooses attending/absent, optionally ticks the food items they want (from that day's menu), and submits.
2. The backend validates the ID (if the registry is enabled), checks for a duplicate record, and checks selected foods against the day's menu.
3. Attendance is saved to Firestore, the counts update, and a confirmation animation appears.
4. The student summary polls `/api/summary` every 5 seconds via `useQuery`.
5. Admins log in, pick a date, and see the live meal plan (aggregated food counts, present/absent lists) plus the 7-day chart and history. They can edit the food menu for any date.

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/attendance` | No | Body: `{student_id, meal, status, foods}`. Marks attendance. `status` is `present`/`absent`; `foods` is an array of menu items (ignored when absent). Returns 409 on duplicate. |
| GET | `/api/menu?date=` | No | Per-meal food lists for a date (defaults to today). |
| POST | `/api/menu` | Admin | Body: `{date, meals:{breakfast, lunch, dinner}}`. Each meal is an array or comma-separated string. Empty falls back to default. |
| GET | `/api/meal-plan?date=` | Admin | Per-meal aggregated food counts plus present/absent lists. |
| GET | `/api/summary?date=` | No | Per-meal attendance counts (present only). |
| GET | `/api/history?date=` | Admin | Full record list for a date (includes status and foods). |
| GET | `/api/stats?days=7` | Admin | Daily per-meal series for charts. |
| GET | `/api/export.csv?date=` | Admin | CSV download. |
| GET | `/api/export.pdf?date=` | Admin | PDF download. |
| POST | `/api/admin/login` | No | Body: `{password}`. Sets the admin session cookie. |
| GET | `/api/auth/status` | No | Returns `{is_admin}` so the SPA can guard routes. |
| POST | `/api/admin/logout` | No | Clears the admin session. |

Admin auth uses Flask sessions; the React SPA reads `GET /api/auth/status` and redirects to `/admin/login` when unauthenticated.

---

## ☁️ Deploying Later

1. Build the frontend (`cd frontend && npm run build`); Flask serves `frontend/dist` automatically.
2. Deploy the Flask app on a host like Render or Railway, setting every `.env` value as an environment variable (including `FIREBASE_CREDENTIALS` as a secret file).
3. Use a production WSGI server:

   ```bash
   gunicorn app:app
   ```

4. Set a strong `FLASK_SECRET_KEY` and disable debug mode.

---

## 🔐 Security Notes

- The admin SDK bypasses Firestore security rules, so lock the rules down (the browser never reads Firestore directly).
- Never commit `service-account.json`, `.env`, `frontend/node_modules`, or `frontend/dist` (all gitignored).
- Meal reminders are client-side only; they depend on the student's browser being open.
- All admin API routes return 401 JSON when not authenticated; the SPA redirects to the login page.
