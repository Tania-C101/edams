import sys
import os
import random
from datetime import datetime
from pymongo import MongoClient
from faker import Faker

# Add project root to path for config import
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db

# ---------------- Collections ----------------
employees_collection = db["employees"]
performance_collection = db["performancereviews"]
dashboard_collection = db["performancedashboards"]
selfeval_collection = db["selfevaluations"]
exit_collection = db["exitinterviews"]

fake = Faker()

CURRENT_YEAR = datetime.now().year
END_YEAR = CURRENT_YEAR - 1        
START_YEAR = END_YEAR - 4           
VALID_YEARS = list(range(START_YEAR, END_YEAR + 1))

# Closed question categories
closed_questions = {
    "Work Quality": ["WQ1", "WQ2", "WQ3", "WQ4"],
    "Communication": ["C1", "C2", "C3", "C4"],
    "Self-awareness": ["SA1", "SA2", "SA3", "SA4"],
    "Team Work": ["TW1", "TW2", "TW3", "TW4"],
    "Adaptability": ["A1", "A2", "A3", "A4"]
}

# ---------------- Helper functions ----------------

def generate_category_scores(perf_total_score):
    """Generate closed question scores influenced by performance review total score."""
    scores = {}
    category_scores = {}

    if perf_total_score >= 18:
        level = "high"
    elif perf_total_score >= 12:
        level = "medium"
    else:
        level = "low"

    level_ranges = {
        "high": (4, 5),
        "medium": (2, 4),
        "low": (1, 3)
    }

    for cat, qs in closed_questions.items():
        total = 0
        for q in qs:
            if random.random() < 0.2:
                base_min, base_max = random.choice(list(level_ranges.values()))
            else:
                base_min, base_max = level_ranges[level]

            score = random.randint(base_min, base_max)
            scores[q] = score
            total += score

        category_scores[cat] = total

    return scores, category_scores

# ---------------- Main generator ----------------

def generate_self_evaluations():
    cutoff_date = datetime(END_YEAR, 8, 15)
    employees = list(employees_collection.find({"doj": {"$lte": cutoff_date}}))

    dashboards = list(
        dashboard_collection.find({"evaluation_ID": {"$regex": "^SE-"}})
    )

    performance_reviews = list(performance_collection.find())

    if not employees or not dashboards:
        print("No eligible employees or self-evaluation dashboards found.")
        return

    records = []

    for emp in employees:
        doj = emp.get("doj")
        emp_code = emp.get("employee_ID")
        emp_id = emp["_id"]

        exit_rec = exit_collection.find_one({"employee_ID": emp_id})
        doe = exit_rec.get("resignation_date") if exit_rec else datetime(END_YEAR, 12, 31)

        start_year = max(doj.year, START_YEAR)
        end_year = min(doe.year, END_YEAR)

        for year in range(start_year, end_year + 1):
            year_start = datetime(year, 1, 1)
            year_end = datetime(year, 12, 31)

            if doj > year_end or doe < year_start:
                continue

            perf_review_id = f"{emp_code}-{year}"
            perf_review = next(
                (pr for pr in performance_reviews
                 if pr.get("performance_review_ID") == perf_review_id),
                None
            )
            if not perf_review:
                continue

            if selfeval_collection.find_one({"performance_review_ID": perf_review_id}):
                continue

            scores, category_scores = generate_category_scores(perf_review["total_score"])

            dashboard = next(
                (d for d in dashboards if d["evaluation_ID"].endswith(str(year))),
                None
            )
            if not dashboard:
                continue

            record = {
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
                "closed_responses": scores,
                "employee_ID": emp_id,
                "performance_review_ID": perf_review_id,
                "evaluation_ID": dashboard["evaluation_ID"],
                "createdAt": datetime.now(),
                "updatedAt": datetime.now()
            }

            records.append(record)

    if records:
        result = selfeval_collection.insert_many(records)
        print(f"Inserted {len(result.inserted_ids)} self-evaluation records ({START_YEAR}–{END_YEAR}).")
    else:
        print("No new self-evaluations generated!")

# ---------------- Entry point ----------------

if __name__ == "__main__":
    generate_self_evaluations()
