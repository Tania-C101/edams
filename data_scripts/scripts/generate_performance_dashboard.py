import sys
import os
from datetime import datetime
from pymongo import MongoClient

# Add project root to path for config import
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db

# Collection
performance_dashboard_collection = db["performancedashboards"]
current_year = datetime.now().year

END_YEAR = current_year - 1        
START_YEAR = END_YEAR - 4        

years = list(range(START_YEAR, END_YEAR + 1))

# Helper function: Determine evaluation status based on date range
def get_status(active_from, active_to):
    today = datetime.now()
    if active_from <= today <= active_to:
        return "Active"
    elif today > active_to:
        return "Expired"
    else:
        return "Inactive" 

# Generate dashboard records (PE + SE per year)
records = []
for y in years:
    # Common active window for both PE and SE
    active_from = datetime(y, 7, 1)
    active_to = datetime(y, 8, 15)
    evaluation_status = get_status(active_from, active_to)

    # Generate both PE and SE dashboards
    for t, title in [("PE", "Performance Review"), ("SE", "Self Evaluation")]:
        evaluation_id = f"{t}-{y}"

        # Skip if record already exists
        existing = performance_dashboard_collection.find_one(
            {"evaluation_ID": evaluation_id}
        )
        if existing:
            continue

        record = {
            "evaluation_ID": evaluation_id,
            "evaluation_title": f"{title} {y}",
            "active_from": active_from,
            "active_to": active_to,
            "evaluation_status": evaluation_status,
        }
        records.append(record)

# Insert new records
if records:
    result = performance_dashboard_collection.insert_many(records)
    print(
        f"Inserted {len(result.inserted_ids)} PE/SE dashboard records across {len(years)} years."
    )
else:
    print("No new dashboard records to insert. All entries already exist.")
