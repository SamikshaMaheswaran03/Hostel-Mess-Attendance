import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

load_dotenv()

from firebase_admin import credentials, firestore, initialize_app

MEALS = ["breakfast", "lunch", "dinner"]
MEAL_LABELS = {"breakfast": "Breakfast", "lunch": "Lunch", "dinner": "Dinner"}
MEAL_STATUSES = ["present", "absent"]

DEFAULT_MENU = {
    "breakfast": ["Idli", "Dosa", "Pongal", "Upma", "Poha"],
    "lunch": ["Rice", "Sambar", "Chapati", "Sabji", "Curd"],
    "dinner": ["Chapati", "Dal", "Rice", "Sabji", "Curd"],
}


class FirebaseNotConfiguredError(RuntimeError):
    pass


def _init_firebase():
    cred_file = os.getenv("FIREBASE_CREDENTIALS", "service-account.json")
    if os.path.exists(cred_file):
        cred = credentials.Certificate(cred_file)
    else:
        cred = credentials.ApplicationDefault()
    app = initialize_app(cred, options={"projectId": os.getenv("PROJECT_ID")})
    return firestore.client(app)


_db = None


def get_db():
    global _db
    if _db is None:
        try:
            _db = _init_firebase()
        except Exception as exc:
            raise FirebaseNotConfiguredError(
                "Firebase is not configured. Add service-account.json and set "
                "PROJECT_ID in .env (see README.md)."
            ) from exc
    return _db


def today_str():
    tz = os.getenv("TZ")
    now = datetime.now(ZoneInfo(tz)) if tz else datetime.now()
    return now.strftime("%Y-%m-%d")


def _attendance_ref():
    return get_db().collection("attendance")


def _menu_ref(date):
    return get_db().collection("menus").document(date)


def student_exists(student_id):
    return get_db().collection("students").document(student_id).get().exists


def add_student(student_id, name=""):
    get_db().collection("students").document(student_id).set(
        {"name": name, "added_at": firestore.SERVER_TIMESTAMP}
    )


def mark_attendance(student_id, meal, date, status="present", foods=None):
    """Upsert a record. Returns (record, created) tuple.

    The doc id is {student_id}_{meal}_{date}, so calling this twice for the
    same student/meal/date is naturally idempotent (created=False on repeat).
    """
    doc_id = f"{student_id}_{meal}_{date}"
    doc_ref = _attendance_ref().document(doc_id)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict(), False
    record = {
        "student_id": student_id,
        "meal": meal,
        "date": date,
        "marked_at": firestore.SERVER_TIMESTAMP,
        "status": status,
        "foods": foods or [],
    }
    doc_ref.set(record)
    return record, True


def get_menu(date):
    """Per-meal food lists for a date, merging saved menus over defaults."""
    doc = _menu_ref(date).get()
    saved = doc.to_dict() if doc.exists else {}
    return {
        meal: [item for item in (saved.get(meal) or DEFAULT_MENU[meal]) if item]
        for meal in MEALS
    }


def save_menu(date, meals):
    def _parse(items):
        if isinstance(items, str):
            return [part.strip() for part in items.split(",") if part.strip()]
        return [str(item).strip() for item in (items or []) if str(item).strip()]

    data = {meal: _parse(meals.get(meal)) for meal in MEALS}
    _menu_ref(date).set(data)
    return data


def get_summary(date):
    counts = {meal: 0 for meal in MEALS}
    snap = _attendance_ref().where("date", "==", date).get()
    for doc in snap:
        meal = doc.get("meal")
        if meal in counts and doc.get("status") != "absent":
            counts[meal] += 1
    return counts


def get_meal_plan(date):
    """Aggregated food selections per meal for the admin dashboard."""
    menu = get_menu(date)
    plan = {
        meal: {
            "menu": menu[meal],
            "counts": {item: 0 for item in menu[meal]},
            "present": [],
            "absent": [],
        }
        for meal in MEALS
    }
    snap = _attendance_ref().where("date", "==", date).get()
    for doc in snap:
        meal = doc.get("meal")
        if meal not in plan:
            continue
        if doc.get("status") == "absent":
            plan[meal]["absent"].append(doc.get("student_id"))
            continue
        foods = [f for f in (doc.get("foods") or []) if f]
        for food in foods:
            if food in plan[meal]["counts"]:
                plan[meal]["counts"][food] += 1
        plan[meal]["present"].append(
            {"student_id": doc.get("student_id"), "foods": foods}
        )

    for meal in MEALS:
        meal_plan = plan[meal]
        meal_plan["present_count"] = len(meal_plan["present"])
        meal_plan["absent_count"] = len(meal_plan["absent"])
        meal_plan["no_selection_count"] = sum(
            1 for p in meal_plan["present"] if not p["foods"]
        )
    return plan


def get_history(date):
    snap = _attendance_ref().where("date", "==", date).get()
    records = [
        {
            "student_id": doc.get("student_id"),
            "meal": doc.get("meal"),
            "meal_label": MEAL_LABELS.get(doc.get("meal"), doc.get("meal")),
            "date": doc.get("date"),
            "marked_at": doc.get("marked_at"),
            "status": doc.get("status", "present"),
            "foods": doc.get("foods") or [],
        }
        for doc in snap
    ]
    return sorted(records, key=lambda r: r["marked_at"] or datetime.min)


def get_stats(days):
    """Daily per-meal counts for the last `days` days, oldest first."""
    tz = os.getenv("TZ")
    base = datetime.now(ZoneInfo(tz)) if tz else datetime.now()
    dates = []
    for offset in range(days - 1, -1, -1):
        d = base - timedelta(days=offset)
        dates.append(d.strftime("%Y-%m-%d"))

    counts = {meal: {d: 0 for d in dates} for meal in MEALS}
    snap = _attendance_ref().get()
    for doc in snap:
        meal = doc.get("meal")
        date = doc.get("date")
        if (
            meal in counts
            and date in counts[meal]
            and doc.get("status") != "absent"
        ):
            counts[meal][date] += 1

    series = []
    for d in dates:
        row = {"date": d}
        for meal in MEALS:
            row[meal] = counts[meal][d]
        series.append(row)
    return series
