import sys
import os
import random
from datetime import datetime
from faker import Faker
from pymongo import MongoClient

# Add project root to path for config import
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db

# MongoDB collections
employees_collection = db["employees"]
performance_collection = db["performancereviews"]
dashboard_collection = db["performancedashboards"]
survey_submission_collection = db["surveysubmissions"]
exit_collection = db["exitinterviews"]

fake = Faker()

CURRENT_YEAR = datetime.now().year
END_YEAR = CURRENT_YEAR - 1         
START_YEAR = END_YEAR - 4           
VALID_YEARS = list(range(START_YEAR, END_YEAR + 1))

# Manager titles
manager_titles = [
    'Assistant Manager', 'Manager', 'Senior Manager',
    'Assistant General Manager', 'General Manager',
    'Tech Lead', 'Architect', 'Project Manager',
    'QA Lead', 'UI/UX Lead'
]

# Closed questions and categories
closed_questions = {
    "Work Quality": ["WQ1", "WQ2", "WQ3", "WQ4"],
    "Communication": ["C1", "C2", "C3", "C4"],
    "Self-awareness": ["SA1", "SA2", "SA3", "SA4"],
    "Team Work": ["TW1", "TW2", "TW3", "TW4"],
    "Adaptability": ["A1", "A2", "A3", "A4"]
}

open_questions = ["excellence", "improvement", "comments"]

# ---------------- Helper functions ----------------

def assign_manager(employee, employees):
    dept = employee.get("department")
    potential = [
        e for e in employees
        if e.get("department") == dept and e.get("job_title") in manager_titles
    ]
    return random.choice(potential)["_id"] if potential else None

def assign_hr(employees):
    hr_candidates = [
        e for e in employees
        if "human" in e.get("department", "").lower()
    ]
    return random.choice(hr_candidates)["_id"] if hr_candidates else None

def determine_performance_level(emp_id, year):
    submissions = list(survey_submission_collection.find({
        "employee_ID": emp_id,
        "survey_code": {"$regex": f"-{year}$"}
    }))

    if not submissions:
        return "medium"

    averages = [
        sub.get("sectionScores", {}).get("overall", 3)
        for sub in submissions
    ]
    avg_score = sum(averages) / len(averages)

    if avg_score >= 4:
        level = "high"
    elif avg_score >= 3:
        level = "medium"
    else:
        level = "low"

    if random.random() < 0.05:
        level = random.choice(["high", "medium", "low"])

    return level

def generate_closed_scores(performance_level):
    scores = {}
    category_scores = {}

    ranges = {
        "high": (4, 5),
        "medium": (3, 4),
        "low": (1, 3)
    }
    lo, hi = ranges.get(performance_level, (3, 4))

    for cat, qs in closed_questions.items():
        total = 0
        for q in qs:
            val = random.randint(lo, hi)
            scores[q] = val
            total += val
        category_scores[cat] = total

    return scores, category_scores

def generate_open_responses(category_scores):
    responses = {}
    for q in open_questions:
        sentence = fake.sentence(nb_words=12)
        low = [
            cat for cat, score in category_scores.items()
            if score / len(closed_questions[cat]) < 3
        ]
        if low:
            sentence += f" Needs improvement in {', '.join(low)}."
        responses[q] = sentence
    return responses

# ---------------- Main generator ----------------

def generate_performance_reviews():
    employees = list(
        employees_collection.find({
            "doj": {"$lte": datetime(END_YEAR, 8, 15)}
        })
    )

    dashboards = list(
        dashboard_collection.find({
            "evaluation_ID": {"$regex": "^PE-"}
        })
    )

    if not employees or not dashboards:
        print("No eligible employees or dashboards found.")
        return

    hr_id = assign_hr(employees)
    records = []

    for emp in employees:
        doj = emp.get("doj")
        emp_code = emp.get("employee_ID")
        emp_id = emp["_id"]

        exit_rec = exit_collection.find_one({"employee_ID": emp_id})
        doe = exit_rec.get("resignation_date") if exit_rec else datetime(END_YEAR, 12, 31)

        start_year = max(START_YEAR, doj.year)
        end_year = min(END_YEAR, doe.year)

        for year in range(start_year, end_year + 1):
            year_start = datetime(year, 1, 1)
            year_end = datetime(year, 12, 31)

            if doj > year_end or doe < year_start:
                continue

            review_id = f"{emp_code}-{year}"
            if performance_collection.find_one({"performance_review_ID": review_id}):
                continue

            dashboard = next(
                (d for d in dashboards if d["evaluation_ID"].endswith(str(year))),
                None
            )
            if not dashboard:
                continue

            perf_level = determine_performance_level(emp_id, year)
            closed_responses, category_scores = generate_closed_scores(perf_level)

            record = {
                "performance_review_ID": review_id,
                "evaluation_ID": dashboard["evaluation_ID"],
                "review_year": year,
                "initials_name": emp.get("initials_name"),
                "doj": doj,
                "job_title": emp.get("job_title"),
                "department": emp.get("department"),
                "work_qual_score": category_scores["Work Quality"],
                "com_score": category_scores["Communication"],
                "awareness_score": category_scores["Self-awareness"],
                "teamwork_score": category_scores["Team Work"],
                "adaptability_score": category_scores["Adaptability"],
                "total_score": sum(category_scores.values()),
                "closed_responses": closed_responses,
                "open_responses": generate_open_responses(category_scores),
                "approval": {"status": "Approved", "approved_at": datetime.now()},
                "employee_ID": emp_id,
                "employee_code": emp_code,
                "manager_ID": assign_manager(emp, employees),
                "hr_ID": hr_id,
                "createdAt": datetime.now(),
                "updatedAt": datetime.now()
            }

            records.append(record)

    if records:
        performance_collection.insert_many(records)
        print(f"Generated {len(records)} performance review records ({START_YEAR}–{END_YEAR}).")
    else:
        print("No new performance reviews generated.")

# ---------------- Entry point ----------------

if __name__ == "__main__":
    generate_performance_reviews()
