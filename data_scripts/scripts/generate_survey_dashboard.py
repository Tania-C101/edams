import sys
import os
from datetime import datetime
from pymongo import MongoClient

# Add project root to path for config import
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db

# Generate Survey Dashboard Records
def generate_survey_records():
    survey_types = ["EES", "JSS", "LIS"]
    current_year = 2025
    num_years = 5
    records = []

    survey_title_map = {
        "EES": "Employee Engagement Survey",
        "JSS": "Job Satisfaction Survey",
        "LIS": "Leadership Improvement Survey"
    }

    now = datetime.now()

    # Generate records for the last 5 years including 2025
    for year in range(current_year - num_years + 1, current_year + 1):
        for survey_type in survey_types:
            survey_id = f"{survey_type}-{year}"
            survey_title = f"{survey_title_map[survey_type]} {year}"

            # Correct date range: October 1 to October 15
            active_from = datetime(year, 10, 1)
            active_to = datetime(year, 10, 15)

            # Determine survey status
            if now < active_from:
                survey_status = "Inactive"  # Not started yet
            elif now > active_to:
                survey_status = "Inactive"  # Already ended
            else:
                survey_status = "Active"    # Currently active

            record = {
                "survey_ID": survey_id,
                "survey_title": survey_title,
                "active_from": active_from,
                "active_to": active_to,
                "survey_status": survey_status,
                "createdAt": now,
                "updatedAt": now
            }

            records.append(record)
    return records


# Main Insert Logic
def main():
    try:
        # Get collection reference
        survey_dashboard_collection = db["surveydashboards"]

        # Remove existing records with same pattern
        survey_dashboard_collection.delete_many({"survey_ID": {"$regex": "^(EES|JSS|LIS)-"}})

        # Generate and insert records
        records = generate_survey_records()
        result = survey_dashboard_collection.insert_many(records)

        print(f"Successfully inserted {len(result.inserted_ids)} survey dashboard records!")
        print("   → 5 EES, 5 JSS, 5 LIS (Total: 15 records)")
    except Exception as e:
        print(f"Error inserting survey dashboards: {e}")


# Run the script
if __name__ == "__main__":
    main()
