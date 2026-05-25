import sys
import os
import random
from datetime import datetime, timedelta
from faker import Faker

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db

survey_submission_collection = db["surveysubmissions"]
survey_dashboard_collection = db["surveydashboards"]
employee_collection = db["employees"]
exit_collection = db["exitinterviews"]

fake = Faker()

SURVEY_TYPES = ["EES", "JSS", "LIS"]

START_YEAR = 2021
END_YEAR = 2025  # Fixed to 2025 as 2026 surveys have not started

EXIT_DECLINE_YEARS = 1  # 1 year before resignation

# ----------------- Helpers -----------------

def random_submission_date(year):
    start = datetime(year, 10, 1)
    end = datetime(year, 10, 15)
    return start + timedelta(days=random.randint(0, (end - start).days))

def clip(x):
    return max(1, min(5, int(round(x))))

def get_exit_info(emp_id):
    """Return exit year and resignation reason directly from exitinterviews."""
    rec = exit_collection.find_one({"employee_ID": emp_id})
    if not rec:
        return None, None

    rd = rec.get("resignation_date")
    rr = rec.get("resignation_reason")

    if isinstance(rd, datetime):
        return rd.year, rr

    return None, rr

def yearly_macro_drift(year):
    base = {
        2021: -0.1,
        2022: 0.05,
        2023: 0.1,
        2024: -0.05,
        2025: 0.0
    }
    return base.get(year, 0.0) + random.uniform(-0.05, 0.05)

# ----------------- Score Generation -----------------

def generate_employee_profile():
    return {
        "baseline": random.gauss(3.2, 0.4),
        "volatility": random.uniform(0.25, 0.6),
        "trend": random.uniform(-0.05, 0.05)
    }

def generate_scores(year, profile, decline_factor=0.0):
    base = (
        profile["baseline"]
        + profile["trend"] * (year - START_YEAR)
        + yearly_macro_drift(year)
        - decline_factor
    )

    ees = random.gauss(base, profile["volatility"])
    lis = random.gauss(base + random.uniform(-0.2, 0.2), profile["volatility"])
    jss = random.gauss(0.55 * ees + 0.45 * lis, profile["volatility"])

    return {
        "EES": clip(ees),
        "LIS": clip(lis),
        "JSS": clip(jss)
    }

def section_scores(overall, survey_type, resignation_reason=None):
    def low(): return random.randint(1, 2)
    def s(mu): return clip(random.gauss(mu, 0.6))

    scores = {
        "overall": overall,
        "communication": s(overall),
        "leadership": s(overall),
        "growth": s(overall),
        "culture": s(overall)
    }

    if not resignation_reason:
        return scores

    if resignation_reason in ["Career change", "Better opportunity"]:
        for k in scores:
            scores[k] = low()
        return scores

    scores["overall"] = low()

    if resignation_reason == "Better salary":
        if survey_type in ["EES", "JSS"]:
            scores["culture"] = low()
        if survey_type == "LIS":
            scores["leadership"] = low()

    elif resignation_reason == "Lack of growth opportunity":
        if survey_type == "EES":
            scores["growth"] = low()
            scores["leadership"] = low()
        if survey_type == "JSS":
            scores["growth"] = low()
        if survey_type == "LIS":
            scores["leadership"] = low()

    elif resignation_reason == "Leadership problems":
        if survey_type == "EES":
            scores["leadership"] = low()
        if survey_type == "LIS":
            scores["communication"] = low()
            scores["leadership"] = low()

    elif resignation_reason in ["Better work-life balance", "Health reasons"]:
        if survey_type in ["EES", "JSS"]:
            scores["culture"] = low()
        if survey_type == "LIS":
            scores["communication"] = low()

    elif resignation_reason in ["Family circumstances", "Relocation", "Personal reasons"]:
        scores["overall"] = low()

    return scores

# ----------------- Main -----------------

def generate_survey_submissions():
    # Include employees joined before 2025-07-31
    employees = list(
        employee_collection.find({"doj": {"$lte": datetime(2025, 7, 31)}})
    )
    surveys = list(survey_dashboard_collection.find())

    if not employees or not surveys:
        print("No employees or surveys.")
        return

    inserted = 0

    for emp in employees:
        doj_year = emp["doj"].year
        exit_year, resignation_reason = get_exit_info(emp["_id"])

        profile = generate_employee_profile()

        # Determine start and end year for surveys
        start = max(START_YEAR, doj_year)
        end = min(exit_year if exit_year else END_YEAR, END_YEAR)

        for year in range(start, end + 1):
            # Apply decline only 1 year before resignation
            decline = 0.0
            if exit_year and year == exit_year - EXIT_DECLINE_YEARS:
                decline = random.uniform(0.3, 0.6)

            scores = generate_scores(year, profile, decline)

            for stype in SURVEY_TYPES:
                survey = next(
                    (s for s in surveys if s["survey_ID"].startswith(f"{stype}-{year}")),
                    None
                )
                if not survey:
                    continue

                # Avoid duplicate submissions
                if survey_submission_collection.find_one({
                    "employee_ID": emp["_id"],
                    "survey_ID": survey["_id"]
                }):
                    continue

                overall = scores[stype]

                record = {
                    "survey_ID": survey["_id"],
                    "survey_code": survey["survey_ID"],
                    "employee_ID": emp["_id"],
                    "submittedAt": random_submission_date(year),
                    "sectionScores": section_scores(
                        overall,
                        stype,
                        resignation_reason if exit_year and year == exit_year - EXIT_DECLINE_YEARS else None
                    )
                }

                survey_submission_collection.insert_one(record)
                inserted += 1

    print(f"Inserted {inserted} survey submissions.")

# ---------------- Entry Point ----------------

if __name__ == "__main__":
    generate_survey_submissions()
