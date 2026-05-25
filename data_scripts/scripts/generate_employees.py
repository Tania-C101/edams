from faker import Faker
from pymongo import MongoClient
import sys
import os
import random
from datetime import datetime, timedelta, date

# Add project root to path for config import
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db

# MongoDB collection
employees_collection = db["employees"]
fake = Faker()

# Config
TODAY = date(2026, 1, 3)
START_YEAR = date(2021, 1, 1)
INTERN_MAX_DAYS = 180  # 6 months
TOTAL_EMPLOYEES = 1000
INACTIVE_COUNT = 587
MIN_INACTIVE_PER_YEAR = 20

departments = ["Human Resources", "Administration", "Information Technology"]
genders = ["Male", "Female"]
marital_statuses = ["Single", "Married"]

hr_admin_titles = [
    "Intern", "Associate", "Executive", "Senior Executive",
    "Team Lead", "Assistant Manager", "Manager",
    "Senior Manager", "Assistant General Manager", "General Manager"
]

it_titles = [
    "Intern", "Administrator", "Associate Software Engineer", "Software Engineer",
    "Senior Software Engineer", "Tech Lead", "Architect",
    "Associate Project Manager", "Project Manager",
    "Associate QA Engineer", "QA Engineer", "Senior QA Engineer", "QA Lead",
    "Associate UI/UX Designer", "UI/UX Designer", "Senior UI/UX Designer", "UI/UX Lead"
]

non_executive_roles = [
    "Intern", "Associate", "Associate Software Engineer",
    "Associate Project Manager", "Associate QA Engineer", "Associate UI/UX Designer"
]

# ---------------- Helpers ----------------
def generate_nic(dob):
    year = dob.year
    if year <= 1999:
        return f"{str(year % 100).zfill(2)}{random.randint(1000000, 9999999)}{random.choice(['V','X'])}"
    return f"{year}{random.randint(10000000, 99999999)}"

def random_dob(min_age=18, max_age=60):
    start = TODAY - timedelta(days=max_age * 365)
    end = TODAY - timedelta(days=min_age * 365)
    d = fake.date_between(start, end)
    return datetime(d.year, d.month, d.day)

def random_doj(start_date=START_YEAR, end_date=TODAY):
    d = fake.date_between(start_date, end_date)
    return datetime(d.year, d.month, d.day)

def format_initials(name):
    parts = name.split()
    return f"{parts[0][0]}. {parts[-1]}" if len(parts) > 1 else name

# ---------------- Generate employees ----------------
employees = []

for _ in range(TOTAL_EMPLOYEES):
    dept = random.choice(departments)
    
    # Job title & DOB
    if dept in ["Human Resources", "Administration"]:
        title = random.choice(hr_admin_titles)
        dob = random_dob(min_age=22)
    else:
        title = random.choice(it_titles)
        dob = random_dob(min_age=28 if title not in non_executive_roles else 18)

    doj = random_doj()  # temporary DOJ

    # Intern rule: change title if DOJ > 6 months ago
    if title == "Intern" and (TODAY - doj.date()).days > INTERN_MAX_DAYS:
        pool = hr_admin_titles if dept != "Information Technology" else it_titles
        title = random.choice([t for t in pool if t != "Intern"])

    full_name = fake.name()

    employees.append({
        "employee_category": "Non-Executive" if title in non_executive_roles else "Executive",
        "full_name": full_name,
        "initials_name": format_initials(full_name),
        "address": fake.address(),
        "gender": random.choice(genders),
        "dob": dob,
        "nic": generate_nic(dob),
        "marital_status": random.choice(marital_statuses),
        "mobile": str(random.randint(700000000, 799999999)),
        "telephone": str(random.randint(100000000, 999999999)),
        "contact_person": fake.name(),
        "contact_person_num": str(random.randint(700000000, 799999999)),
        "department": dept,
        "job_title": title,
        "doj": doj,
        "employment_status": "Active"  # default
    })

# ---------------- Assign Inactive employees ----------------
inactive_indices = set()

# Ensure at least MIN_INACTIVE_PER_YEAR inactive per year from 2021–2025
years = [2021, 2022, 2023, 2024, 2025]
for year in years:
    candidates = list(set(range(TOTAL_EMPLOYEES)) - inactive_indices)
    selected_for_year = random.sample(candidates, MIN_INACTIVE_PER_YEAR)
    for idx in selected_for_year:
        # DOJ within that year
        start_date = datetime(year, 1, 1)
        end_date = datetime(year, 12, 31)
        employees[idx]["doj"] = random_doj(start_date=start_date, end_date=end_date)
        employees[idx]["employment_status"] = "Inactive"
    inactive_indices.update(selected_for_year)

# Assign remaining inactive randomly to reach INACTIVE_COUNT
remaining_inactive = INACTIVE_COUNT - len(inactive_indices)
if remaining_inactive > 0:
    candidates = list(set(range(TOTAL_EMPLOYEES)) - inactive_indices)
    extra_inactive = random.sample(candidates, remaining_inactive)
    for idx in extra_inactive:
        # DOJ between 2021 and 2025
        start_date = datetime(2021, 1, 1)
        end_date = datetime(2025, 12, 31)
        employees[idx]["doj"] = random_doj(start_date=start_date, end_date=end_date)
        employees[idx]["employment_status"] = "Inactive"
    inactive_indices.update(extra_inactive)

# ---------------- Assign Employee IDs chronologically ----------------
employees.sort(key=lambda x: x["doj"])
for idx, emp in enumerate(employees, start=1):
    emp["employee_ID"] = f"EMP{idx:04d}"

# ---------------- Insert into MongoDB ----------------
employees_collection.insert_many(employees)
print(f"Inserted {TOTAL_EMPLOYEES} employees ({INACTIVE_COUNT} Inactive from 2021–2025)")
