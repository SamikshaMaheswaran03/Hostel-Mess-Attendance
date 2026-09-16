import csv
import io
import os
from functools import wraps

from dotenv import load_dotenv
from fpdf import FPDF
from flask import (
    Flask,
    jsonify,
    request,
    send_from_directory,
    session,
)

import mock_store

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
app.config["SESSION_COOKIE_HTTPONLY"] = True

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")
STUDENT_REGISTRY = os.getenv("STUDENT_REGISTRY", "1").lower() in ("1", "true", "yes")


def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("is_admin"):
            return jsonify({"ok": False, "message": "Admin login required."}), 401
        return f(*args, **kwargs)

    return wrapper


# ---------- SPA serving ----------

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa(path):
    if path.startswith("api/"):
        return jsonify({"ok": False, "message": "Not found."}), 404
    file_path = os.path.join(DIST_DIR, path)
    if path and os.path.isfile(file_path):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


# ---------- Admin auth ----------

@app.post("/api/admin/login")
def api_admin_login():
    data = request.get_json(silent=True) or {}
    if data.get("password") == ADMIN_PASSWORD:
        session["is_admin"] = True
        return jsonify({"ok": True})
    return jsonify({"ok": False, "message": "Incorrect password."}), 401


@app.get("/api/auth/status")
def api_auth_status():
    return jsonify({"is_admin": bool(session.get("is_admin"))})


@app.get("/api/auth/demo")
def api_auth_demo():
    return jsonify({"password": ADMIN_PASSWORD})


@app.post("/api/admin/logout")
def api_admin_logout():
    session.pop("is_admin", None)
    return jsonify({"ok": True})


# ---------- Attendance ----------

@app.post("/api/attendance")
def api_attendance():
    data = request.get_json(silent=True) or {}
    student_id = (data.get("student_id") or "").strip()
    meal = (data.get("meal") or "").strip().lower()
    status = (data.get("status") or "present").strip().lower()
    foods = data.get("foods") or []

    if not student_id or meal not in mock_store.MEALS:
        return jsonify({"ok": False, "message": "Enter a valid student ID and select a meal."}), 400

    if status not in mock_store.MEAL_STATUSES:
        return jsonify({"ok": False, "message": "Status must be 'present' or 'absent'."}), 400

    if STUDENT_REGISTRY and not mock_store.student_exists(student_id):
        return jsonify({"ok": False, "message": f"Student ID {student_id} is not registered."}), 404

    date = mock_store.today_str()
    menu = mock_store.get_menu(date)

    if status != "absent":
        foods = [str(f).strip() for f in foods if str(f).strip()]
        unknown = [f for f in foods if f not in menu.get(meal, [])]
        if unknown:
            return jsonify(
                {"ok": False, "message": f"Unknown food items for {mock_store.MEAL_LABELS[meal]}: {', '.join(unknown)}."}
            ), 400
    else:
        foods = []

    record, created = mock_store.mark_attendance(student_id, meal, date, status=status, foods=foods)
    if not created:
        return jsonify(
            {
                "ok": False,
                "message": f"{student_id} already marked {mock_store.MEAL_LABELS[meal]} today.",
            }
        ), 409

    summary = mock_store.get_summary(date)
    meal_plan = mock_store.get_meal_plan(date)
    return jsonify(
        {
            "ok": True,
            "message": f"Recorded: {student_id} for {mock_store.MEAL_LABELS[meal]}.",
            "summary": summary,
            "meal_plan": meal_plan,
        }
    )


@app.get("/api/menu")
def api_menu():
    date = request.args.get("date") or mock_store.today_str()
    return jsonify({"date": date, "meals": mock_store.get_menu(date)})


@app.post("/api/menu")
@require_admin
def api_menu_save():
    data = request.get_json(silent=True) or {}
    date = data.get("date") or mock_store.today_str()
    meals = {meal: (data.get("meals", {}) or {}).get(meal) for meal in mock_store.MEALS}
    saved = mock_store.save_menu(date, meals)
    return jsonify({"ok": True, "date": date, "meals": saved})


@app.get("/api/meal-plan")
@require_admin
def api_meal_plan():
    date = request.args.get("date") or mock_store.today_str()
    return jsonify({"date": date, "meals": mock_store.get_meal_plan(date)})


@app.get("/api/summary")
def api_summary():
    date = request.args.get("date") or mock_store.today_str()
    return jsonify({"date": date, "summary": mock_store.get_summary(date)})


@app.get("/api/history")
@require_admin
def api_history():
    date = request.args.get("date") or mock_store.today_str()
    return jsonify({"date": date, "records": mock_store.get_history(date)})


@app.get("/api/stats")
@require_admin
def api_stats():
    try:
        days = int(request.args.get("days", 7))
    except ValueError:
        days = 7
    days = max(1, min(days, 60))
    return jsonify({"series": mock_store.get_stats(days)})


@app.get("/api/export.csv")
@require_admin
def api_export_csv():
    date = request.args.get("date") or mock_store.today_str()
    records = mock_store.get_history(date)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["student_id", "meal", "status", "foods", "date", "marked_at"])
    for r in records:
        writer.writerow(
            [
                r["student_id"],
                r["meal"],
                r.get("status", "present"),
                "; ".join(r.get("foods") or []),
                r["date"],
                r["marked_at"],
            ]
        )

    return (
        buf.getvalue(),
        200,
        {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": f"attachment; filename=attendance_{date}.csv",
        },
    )


@app.get("/api/export.pdf")
@require_admin
def api_export_pdf():
    date = request.args.get("date") or mock_store.today_str()
    records = mock_store.get_history(date)
    summary = mock_store.get_summary(date)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, f"Meal Attendance - {date}", ln=True, align="C")
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 11)
    for meal in mock_store.MEALS:
        pdf.cell(0, 8, f"{mock_store.MEAL_LABELS[meal]}: {summary[meal]}", ln=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(50, 8, "Student ID", border=1)
    pdf.cell(30, 8, "Meal", border=1)
    pdf.cell(25, 8, "Status", border=1)
    pdf.cell(0, 8, "Foods", border=1, ln=True)

    pdf.set_font("Helvetica", "", 10)
    for r in records:
        pdf.cell(50, 8, str(r["student_id"]), border=1)
        pdf.cell(30, 8, r["meal_label"], border=1)
        pdf.cell(25, 8, r.get("status", "present"), border=1)
        pdf.cell(0, 8, ", ".join(r.get("foods") or []), border=1, ln=True)

    return (
        pdf.output(dest="S"),
        200,
        {
            "Content-Type": "application/pdf",
            "Content-Disposition": f"attachment; filename=attendance_{date}.pdf",
        },
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
