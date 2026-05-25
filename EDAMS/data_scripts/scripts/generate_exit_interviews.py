from faker import Faker
import random
from datetime import datetime, timedelta
import sys
import os

# Add project root to path for config import
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db

# Collections
employees_collection = db["employees"]
exit_collection = db["exitinterviews"]

fake = Faker()

# Config
TODAY = datetime(2026, 1, 3)  # Upper limit for resignation dates
RESIGNATION_YEARS = [2021, 2022, 2023, 2024, 2025, 2026]

# Resignation reasons
resignation_reasons = [
    "Career change",
    "Better opportunity",
    "Better salary",
    "Better work-life balance",
    "Health reasons",
    "Family circumstances",
    "Relocation",
    "Personal reasons",
    "Lack of growth opportunity",
    "Leadership problems"
]

# Questions
question_sets = {
    "set1": [
        "Salary level and compensation practices",
        "Insurance benefits",
        "Opportunities for growth and advancement",
        "Direction received from your supervisor"
    ],
    "set2": [
        "Support received from your supervisor",
        "Quality of training and development programs",
        "Relationship with co-workers",
        "Physical working conditions"
    ]
}

all_questions = question_sets["set1"] + question_sets["set2"]

# Clearance options
clearance_options = ["Yes", "No", "Pending"]

# ---------------- Helper Functions ----------------

def generate_answers(resignation_reason):
    answers = {}
    for question in all_questions:
        rating = random.randint(3, 5)
        if resignation_reason == "Better salary" and question == "Salary level and compensation practices":
            rating = random.randint(1, 2)
        elif resignation_reason == "Lack of growth opportunity" and question in [
            "Opportunities for growth and advancement",
            "Direction received from your supervisor",
            "Support received from your supervisor",
            "Quality of training and development programs"
        ]:
            rating = random.randint(1, 3)
        elif resignation_reason == "Leadership problems" and question in [
            "Direction received from your supervisor",
            "Support received from your supervisor"
        ]:
            rating = random.randint(1, 2)
        elif resignation_reason in ["Better work-life balance", "Health reasons"] and question == "Physical working conditions":
            rating = random.randint(1, 3)
        elif resignation_reason in ["Family circumstances", "Relocation", "Personal reasons"]:
            rating = random.randint(3, 5)
        elif resignation_reason in ["Career change", "Better opportunity"]:
            rating = random.randint(2, 4)
        answers[question] = rating
    return answers

def random_asset_return():
    return {
        "asset_return_mobile": random.choices(["Yes", "No", "N/A"], [0.88, 0.08, 0.04])[0],
        "asset_return_laptop": random.choices(["Yes", "No", "N/A"], [0.85, 0.10, 0.05])[0],
        "asset_return_cable": random.choices(["Yes", "No", "N/A"], [0.90, 0.08, 0.02])[0],
        "asset_return_id": random.choices(["Yes", "No", "N/A"], [0.95, 0.03, 0.02])[0],
        "asset_return_other": random.choices(["N/A", "Yes"], [0.7, 0.3])[0]
    }

def derive_clearances_from_assets(asset_status):
    mobile = asset_status["asset_return_mobile"]
    laptop = asset_status["asset_return_laptop"]
    cable = asset_status["asset_return_cable"]
    asset_id = asset_status["asset_return_id"]

    if any(x == "No" for x in (mobile, laptop, cable)):
        it_status = "No"
    elif any(x == "N/A" for x in (mobile, laptop, cable)):
        it_status = "Pending"
    else:
        it_status = "Yes"

    if asset_id == "No":
        hr_status = "No"
    elif asset_id == "N/A":
        hr_status = "Pending"
    else:
        hr_status = "Yes"

    admin_status = random.choices(clearance_options, [0.8, 0.1, 0.1])[0]

    return {
        "it_clearance_status": it_status,
        "admin_clearance_status": admin_status,
        "hr_clearance_status": hr_status
    }

def generate_resignation_date_for_year(doj, year):
    start_of_year = datetime(year, 1, 1)
    end_of_year = datetime(year, 12, 31)
    start_date = max(doj, start_of_year)
    end_date = min(TODAY, end_of_year)
    if start_date > end_date:
        return end_date
    delta_days = (end_date - start_date).days
    random_days = random.randint(0, delta_days)
    return start_date + timedelta(days=random_days)

# ---------------- Main Function ----------------

def generate_exit_interviews():
    """Generate exit interviews for all inactive employees, distributed over years."""
    inactive_employees = list(employees_collection.find({"employment_status": "Inactive"}))
    hr_employees = list(employees_collection.find({"department": {"$regex": "Human", "$options": "i"}}))

    if not inactive_employees:
        print("No inactive employees found!")
        return

    records = []

    for emp in inactive_employees:
        emp_oid = emp.get("_id")

        # Skip if exit interview already exists
        if exit_collection.find_one({"employee_ID": emp_oid}):
            continue

        doj = emp.get("doj")
        # Decide year for resignation: same year as DOJ or later (up to 2026)
        min_year = max(doj.year, 2021)
        max_year = min(2026, TODAY.year)
        resignation_year = random.randint(min_year, max_year)

        resignation_date = generate_resignation_date_for_year(doj, resignation_year)
        resignation_reason = random.choice(resignation_reasons)
        answers = generate_answers(resignation_reason)
        asset_status = random_asset_return()
        clearance_status = derive_clearances_from_assets(asset_status)
        hr = random.choice(hr_employees) if hr_employees else None
        hr_id = hr["_id"] if hr else None

        record = {
            "employee_ID": emp_oid,
            "hr_ID": hr_id,
            "initials_name": emp.get("initials_name"),
            "doj": doj,
            "job_title": emp.get("job_title"),
            "department": emp.get("department"),
            "resignation_date": resignation_date,
            "resignation_reason": resignation_reason,
            "answers": answers,
            "asset_return_mobile": asset_status["asset_return_mobile"],
            "asset_return_laptop": asset_status["asset_return_laptop"],
            "asset_return_cable": asset_status["asset_return_cable"],
            "asset_return_id": asset_status["asset_return_id"],
            "asset_return_other": asset_status["asset_return_other"],
            "it_clearance_status": clearance_status["it_clearance_status"],
            "admin_clearance_status": clearance_status["admin_clearance_status"],
            "hr_clearance_status": clearance_status["hr_clearance_status"],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        records.append(record)

    if records:
        exit_collection.insert_many(records)
        print(f"Successfully generated {len(records)} exit interviews for all inactive employees!")
    else:
        print("No new exit interviews generated!")

# ---------------- Entry Point ----------------

if __name__ == "__main__":
    generate_exit_interviews()
