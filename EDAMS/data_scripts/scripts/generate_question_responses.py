import sys
import os
import random
import json

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db

survey_submission_collection = db["surveysubmissions"]
question_response_collection = db["questionresponses"]

base_path = os.path.join(os.path.dirname(__file__), "../data")

SURVEY_QUESTIONS = {
    "EES": json.load(open(os.path.join(base_path, "questions_engagement.json"))),
    "JSS": json.load(open(os.path.join(base_path, "questions_job_satisfaction.json"))),
    "LIS": json.load(open(os.path.join(base_path, "questions_leadership.json")))
}

# ---------------- Adjusted: No skipping ----------------
QUESTION_SKIP_PROB = 0
SECTION_SKIP_PROB = 0

# ---------------- Utilities ----------------

def clamp(x):
    """Clamp answer to integer between 1 and 5."""
    try:
        return max(1, min(5, int(round(x))))
    except:
        return 3

def extract_prefix(code):
    return code.split("-")[0]

def map_section_title_to_score_key(title):
    t = title.lower()

    if "communication" in t:
        return "communication"
    if "leadership" in t:
        return "leadership"
    if "growth" in t or "career" in t or "development" in t:
        return "growth"
    if "culture" in t or "workplace" in t or "well-being" in t:
        return "culture"

    return "overall"

# ---------------- Main ----------------

def generate_question_responses():
    submissions = list(survey_submission_collection.find())
    if not submissions:
        print("No submissions.")
        return

    total = 0

    for sub in submissions:
        if not sub.get("sectionScores"):
            continue

        # Skip if responses already exist
        if question_response_collection.count_documents(
            {"submission_ID": sub["_id"]}
        ) > 0:
            continue

        prefix = extract_prefix(sub.get("survey_code", ""))
        if prefix not in SURVEY_QUESTIONS:
            continue

        responses = []
        section_totals = {}
        grand_total = 0

        # Iterate all sections
        for section in SURVEY_QUESTIONS[prefix].values():

            title = section.get("title", "Unknown Section")
            score_key = map_section_title_to_score_key(title)

            base = sub["sectionScores"].get(
                score_key,
                sub["sectionScores"].get("overall", 3)
            )

            volatility = random.uniform(0.4, 0.8)
            section_sum = 0

            # Iterate all questions in section
            for q in section.get("questions", []):
                ans = clamp(random.gauss(base, volatility))

                responses.append({
                    "survey_ID": sub["survey_ID"],
                    "survey_code": sub.get("survey_code"),
                    "submission_ID": sub["_id"],
                    "section_title": title,
                    "question_id": q.get("id"),
                    "question_text": q.get("text"),
                    "answer_value": ans
                })

                section_sum += ans
                grand_total += ans

            if section_sum > 0:
                section_totals[title] = section_sum

        # Insert all question responses for this submission
        if responses:
            question_response_collection.insert_many(responses)
            survey_submission_collection.update_one(
                {"_id": sub["_id"]},
                {"$set": {
                    "sectionTotals": section_totals,
                    "totalScore": grand_total
                }}
            )
            total += len(responses)

    print(f"Inserted {total} question responses.")

# ---------------- Entry Point ----------------

if __name__ == "__main__":
    generate_question_responses()
