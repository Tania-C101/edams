from faker import Faker
from pymongo import MongoClient
import random
import string
import bcrypt
import sys
import os

# Add project root to path for config import
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db

# Collections
employees_collection = db["employees"]
useraccounts_collection = db["useraccounts"]

# Faker setup
fake = Faker()

# Manager roles mapping
manager_titles = [
    'Assistant Manager', 'Manager', 'Senior Manager', 'Assistant General Manager',
    'General Manager', 'Tech Lead', 'Architect', 'Project Manager', 'QA Lead', 'UI/UX Lead'
]

# Admin role mapping
admin_titles = ['Administrator']

# Helper Functions
def generate_password(length=10):
    # Generates a password with at least 8 characters and 1 digit.
    if length < 8:
        length = 8
    letters = string.ascii_letters
    digits = string.digits
    password_chars = [random.choice(digits)]  # Ensure at least one digit
    password_chars += [random.choice(letters + digits) for _ in range(length - 1)]
    random.shuffle(password_chars)
    return ''.join(password_chars)

def hash_password(password):
    # Hashes the password using bcrypt and returns a UTF-8 string.
    salt = bcrypt.gensalt(10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')  # decode bytes → readable string

def determine_role(department, job_title):
    # Determines user role based on department and job title.
    if department == 'Human Resources':
        return 'HR'
    elif job_title in manager_titles and department in ['Administration', 'Information Technology']:
        return 'Manager'
    elif job_title in admin_titles:
        return 'Admin'
    else:
        return 'Employee'

# Generate User Accounts
employees = list(employees_collection.find())
user_accounts = []

for emp in employees:
    username = emp.get('employee_ID')

    # Skip if username already exists in useraccounts
    if useraccounts_collection.find_one({"username": username}):
        continue

    emp_id = emp.get('_id')
    department = emp.get('department')
    job_title = emp.get('job_title')
    employment_status = emp.get('employment_status', 'Active')

    role = determine_role(department, job_title)
    account_status = 'Active' if employment_status == 'Active' else 'Inactive'

    password_plain = generate_password(length=10)
    password_hashed = hash_password(password_plain)

    user_account = {
        "username": username,
        "password": password_hashed,  # bcrypt hash as readable string
        "role": role,
        "account_status": account_status,
        "employee_ID": emp_id
    }

    user_accounts.append(user_account)

# Insert into MongoDB
if user_accounts:
    useraccounts_collection.insert_many(user_accounts)
    print(f"Successfully inserted {len(user_accounts)} new user accounts into MongoDB!")
else:
    print("No new employees found. No user accounts created!")
