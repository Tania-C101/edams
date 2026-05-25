import sys
import os
import pandas as pd
from collections import defaultdict
import random
from datetime import datetime

# Add parent directory to Python path so local modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db
from utils_attrition import safe_get_section_overall

OUTPUT_CSV = "attrition_features.csv"
CURRENT_YEAR = datetime.now().year

# Number of years of historical data to include
YEARS_BACK = 5
YEARS = list(range(CURRENT_YEAR - YEARS_BACK, CURRENT_YEAR))

def build_employee_year_matrix():
    # Load employees
    employees = list(db["employees"].find({}))

    # Create a lookup dictionary
    employee_by_id = {e["_id"]: e for e in employees}

    # Load employees exit interviews
    exit_interviews = list(
        db["exitinterviews"].find({}, {"employee_ID": 1, "resignation_date": 1})
    )

    # Dictionary to store the year an employee exited
    employee_exit_year = {}
    for rec in exit_interviews:
        emp_id = rec.get("employee_ID")
        resignation_date = rec.get("resignation_date")
        if emp_id and isinstance(resignation_date, datetime):
            employee_exit_year[emp_id] = min(resignation_date.year, CURRENT_YEAR - 1)

    # Ensure every employee has an entry (None if still active)
    for emp in employees:
        employee_exit_year.setdefault(emp["_id"], None)

    # Fetch survey submissions
    submissions = list(
        db["surveysubmissions"].find(
            {}, {"employee_ID": 1, "survey_code": 1, "submittedAt": 1, "sectionScores": 1}
        )
    )

    # Nested structure:
    # employee_id -> year -> survey_type -> score
    employee_year_scores = defaultdict(lambda: defaultdict(dict))

    # Process each survey submission
    for sub in submissions:
        emp_id = sub.get("employee_ID")
        if not emp_id or not sub.get("sectionScores"):
            continue

        # Determine year
        if isinstance(sub.get("submittedAt"), datetime):
            year = sub["submittedAt"].year
        else:
            try:
                year = int(sub.get("survey_code", "").split("-")[1])
            except Exception:
                continue

        # Ignore surveys outside the target year range        
        if year not in YEARS:
            continue

        survey_code = sub.get("survey_code", "")
        survey_type = survey_code.split("-")[0] if "-" in survey_code else "GEN"

        # Compute overall survey score
        score = safe_get_section_overall(sub)

        # Add small noise
        score = max(1.0, min(5.0, score + random.uniform(-0.5, 0.5)))

        employee_year_scores[emp_id][year][survey_type] = score

    # Build feature rows
    rows = []

     # Iterate through each employee’s yearly survey scores
    for emp_id, yearly_scores in employee_year_scores.items():
        emp = employee_by_id.get(emp_id)
        if not emp:
            continue

        doj = emp.get("doj")
        if not isinstance(doj, datetime):
            continue

        joining_year = doj.year
        exit_year = employee_exit_year.get(emp_id)

         # Create one row per employee per year
        for year in YEARS:
            if year < joining_year:
                continue
            if exit_year and year > exit_year:
                continue

            scores = yearly_scores.get(year, {})

            # Append engineered feature row
            rows.append({
                "employee_id": emp_id,
                "year": year,
                "tenure_years": year - joining_year,
                "EES_overall": scores.get("EES"),
                "JSS_overall": scores.get("JSS"),
                "LIS_overall": scores.get("LIS"),
                "num_surveys_year": len(scores),
                "department": emp.get("department"),
                "role": emp.get("job_title")
            })

    # Convert list of rows into a DataFrame
    df = pd.DataFrame(rows)
    if df.empty:
        print("No valid employee-year rows generated.")
        return df

    # Normalize scores
    score_cols = ["EES_overall", "JSS_overall", "LIS_overall"]

    for col in score_cols:
        df[col] = df[col].fillna(df[col].mean())
        df[f"{col}_norm"] = df[col] / 5.0

    # Sort data so lag features are calculated correctly
    df.sort_values(["employee_id", "year"], inplace=True)

    for col in score_cols:
        # Extract base name
        base = col.split("_")[0]

        # Previous year’s score for the same employee
        df[f"{base}_prev"] = df.groupby("employee_id")[col].shift(1)

        # Year-over-year change in score
        df[f"delta_{base}"] = df[col] - df[f"{base}_prev"]

    # Initialize attrition label as 0 
    df["attrition_next_year"] = 0

    # Mark attrition in the year before exit
    for emp_id, exit_year in employee_exit_year.items():
        if exit_year:
            label_year = exit_year - 1
            df.loc[
                (df["employee_id"] == emp_id) & (df["year"] == label_year),
                "attrition_next_year"
            ] = 1

     # Save engineered features to CSV
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Attrition features written to {OUTPUT_CSV} ({len(df)} rows)")

    return df

# Run feature engineering
if __name__ == "__main__":
    build_employee_year_matrix()
