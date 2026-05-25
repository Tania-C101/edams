# utils_attrition.py
import math
from datetime import datetime

def year_from_date(d):
    """Extract a year integer from a datetime, date string, or int."""
    if d is None:
        return None
    if isinstance(d, (int, float)):
        # Already numeric year
        return int(d)
    if hasattr(d, "year"):
        return int(d.year)
    try:
        return int(str(d)[:4])
    except Exception:
        return None


def safe_get_section_overall(sub):
    # Compute an overall score from sectionScores map in a SurveySubmission document.
    ss = sub.get("sectionScores")
    if not ss:
        return None

    # If it's a pymongo SON or dict-like object
    if hasattr(ss, "values"):
        numeric_vals = [float(v) for v in ss.values() if isinstance(v, (int, float))]
    else:
        numeric_vals = []

    if not numeric_vals:
        return None

    return float(sum(numeric_vals)) / len(numeric_vals)


def clip01(x):
    # Clip probability-like value to [0, 1]
    if x is None or (isinstance(x, float) and (x != x)):
        return 0.0
    return float(max(0.0, min(1.0, x)))


def safe_div(a, b):
    # Safely divide, return None if division invalid.
    try:
        return a / b
    except Exception:
        return None
