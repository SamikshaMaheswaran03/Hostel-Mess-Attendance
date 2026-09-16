import os
import random
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

load_dotenv()

MEALS = ["breakfast", "lunch", "dinner"]
MEAL_LABELS = {"breakfast": "Breakfast", "lunch": "Lunch", "dinner": "Dinner"}
MEAL_STATUSES = ["present", "absent"]

DEFAULT_MENU = {
    "breakfast": ["Idli", "Dosa", "Pongal", "Upma", "Poha"],
    "lunch": ["Rice", "Sambar", "Chapati", "Sabji", "Curd"],
    "dinner": ["Chapati", "Dal", "Rice", "Sabji", "Curd"],
}

STUDENTS = [
    "2024CS001",
    "2024CS002",
    "2024CS003",
    "2024ME004",
    "2024ME007",
    "2024CS008",
    "2025EE005",
    "2025CE006",
    "2025CS009",
    "2025EE010",
]

_records = {}
_menus = {}

_MEAL_HOURS = {"breakfast": 7, "lunch": 12, "dinner": 19}


def _now():
    tz = os.getenv("TZ")
    if not tz:
        return datetime.now()
    try:
        return datetime.now(ZoneInfo(tz))
    except Exception:
        return datetime.now()


def today_str():
    return _now().strftime("%Y-%m-%d")


def _date_str(days_ago):
    base = _now() - timedelta(days=days_ago)
    return base.strftime("%Y-%m-%d"), base


def _mark(student_id, meal, date, timestamp, status="present", foods=None):
    key = f"{student_id}_{meal}_{date}"
    if key in _records:
        return _records[key], False
    record = {
        "student_id": student_id,
        "meal": meal,
        "date": date,
        "marked_at": timestamp,
        "status": status,
        "foods": foods or [],
    }
    _records[key] = record
    return record, True


def _seed():
    rng = random.Random(42)
    for meal in MEALS:
        for student_id in STUDENTS:
            for days_ago in range(7):
                if rng.random() < 0.7:
                    date, base = _date_str(days_ago)
                    hour = _MEAL_HOURS[meal]
                    ts = base.replace(
                        hour=hour,
                        minute=rng.randint(0, 59),
                        second=rng.randint(0, 59),
                    )
                    _mark(student_id, meal, date, ts)


_seed()


def student_exists(student_id):
    return student_id in STUDENTS


def add_student(student_id, name=""):
    if student_id not in STUDENTS:
        STUDENTS.append(student_id)


def mark_attendance(student_id, meal, date, status="present", foods=None):
    ts = _now()
    timestamp = ts.replace(
        hour=_MEAL_HOURS[meal],
        minute=ts.minute,
        second=ts.second,
        microsecond=0,
    )
    return _mark(student_id, meal, date, timestamp, status=status, foods=foods)


def get_menu(date):
    """Per-meal food lists for a date, merging saved menus over defaults."""
    saved = _menus.get(date, {})
    return {
        meal: list(saved.get(meal) or DEFAULT_MENU[meal]) for meal in MEALS
    }


def save_menu(date, meals):
    def _parse(items):
        if isinstance(items, str):
            return [part.strip() for part in items.split(",") if part.strip()]
        return [str(item).strip() for item in (items or []) if str(item).strip()]

    _menus[date] = {meal: _parse(meals.get(meal)) for meal in MEALS}
    return _menus[date]


def get_summary(date):
    counts = {meal: 0 for meal in MEALS}
    for record in _records.values():
        if (
            record["date"] == date
            and record["meal"] in counts
            and record.get("status") != "absent"
        ):
            counts[record["meal"]] += 1
    return counts


def get_meal_plan(date):
    """Aggregated food selections per meal for the admin dashboard."""
    menu = get_menu(date)
    plan = {}
    for meal in MEALS:
        counts = {item: 0 for item in menu[meal]}
        present = []
        absent = []
        for record in _records.values():
            if record["date"] != date or record["meal"] != meal:
                continue
            if record.get("status") == "absent":
                absent.append(record["student_id"])
                continue
            foods = record.get("foods") or []
            for food in foods:
                if food in counts:
                    counts[food] += 1
            present.append(
                {"student_id": record["student_id"], "foods": foods}
            )
        plan[meal] = {
            "menu": menu[meal],
            "counts": counts,
            "present_count": len(present),
            "absent_count": len(absent),
            "no_selection_count": sum(1 for p in present if not p["foods"]),
            "present": present,
            "absent": absent,
        }
    return plan


def get_history(date):
    records = [
        {
            "student_id": r["student_id"],
            "meal": r["meal"],
            "meal_label": MEAL_LABELS.get(r["meal"], r["meal"]),
            "date": r["date"],
            "marked_at": r["marked_at"],
            "status": r.get("status", "present"),
            "foods": r.get("foods") or [],
        }
        for r in _records.values()
        if r["date"] == date
    ]
    return sorted(records, key=lambda r: r["marked_at"] or datetime.min)


def get_stats(days):
    base = _now()
    dates = []
    for offset in range(days - 1, -1, -1):
        d = base - timedelta(days=offset)
        dates.append(d.strftime("%Y-%m-%d"))

    counts = {meal: {d: 0 for d in dates} for meal in MEALS}
    for record in _records.values():
        meal = record["meal"]
        date = record["date"]
        if (
            meal in counts
            and date in counts[meal]
            and record.get("status") != "absent"
        ):
            counts[meal][date] += 1

    series = []
    for d in dates:
        row = {"date": d}
        for meal in MEALS:
            row[meal] = counts[meal][d]
        series.append(row)
    return series