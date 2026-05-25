# predict_attrition_latest_year.py
import sys
import os
import pandas as pd
import numpy as np
import joblib
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import db
from utils_attrition import clip01

# Loads the trained model, applies it to the latest year’s employee data. 
# Generates attrition risk probabilities, Stores the results in MongoDB.

MODEL_PATH = "attrition_model.joblib"
FEATURE_CSV = "attrition_features.csv"
FEATURE_LIST_PATH = "feature_list.txt"
OUTPUT_COLLECTION = "employee_attrition_predictions"


def load_features():
    if not os.path.exists(FEATURE_CSV):
        raise RuntimeError("Feature CSV not found. Run ETL first.")
    df = pd.read_csv(FEATURE_CSV)
    if df.empty:
        raise RuntimeError("Feature CSV is empty.")
    return df


def get_feature_list(df):
    if os.path.exists(FEATURE_LIST_PATH):
        with open(FEATURE_LIST_PATH, "r") as fh:
            features = fh.read().strip().split(",")
    else:
        features = [
            "EES_overall_norm", "JSS_overall_norm", "LIS_overall_norm",
            "EES_prev", "JSS_prev", "LIS_prev",
            "delta_EES", "delta_JSS", "delta_LIS",
            "tenure_years", "num_surveys_year",
            "department", "role"
        ]
    # Only keep columns that exist in df
    return [c for c in features if c in df.columns]


def predict_latest_year():
    # Load model
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError("Model not found. Train it first.")
    model = joblib.load(MODEL_PATH)

    # Load features
    df = load_features()
    features = get_feature_list(df)

    # Exclude current year if it's not completed
    current_year = datetime.now().year
    latest_year = df["year"].max()
    if latest_year >= current_year:
        print(f"Skipping incomplete current year {current_year}")
        latest_year = df[df["year"] < current_year]["year"].max()

    df_latest = df[df["year"] == latest_year].copy()
    if df_latest.empty:
        print(f"No data for latest completed year {latest_year}.")
        return

    # Only employees with valid attrition label
    df_latest = df_latest[df_latest["attrition_next_year"].notna()]

    # Prepare X
    X = df_latest[features]

    # Predict probabilities safely
    try:
        proba_raw = model.predict_proba(X)
        if proba_raw.shape[1] == 2:
            proba = proba_raw[:, 1]
        else:
            single_class = model.classes_[0]
            proba = np.ones(len(X)) if single_class == 1 else np.zeros(len(X))
            print("Warning: Only one class present; all predictions are the same.")
    except Exception as e:
        print(f"Prediction failed: {e}")
        return

    # Clip probabilities to 0-1
    df_latest["predicted_attrition_risk"] = [clip01(float(x)) for x in proba]

    # Save to MongoDB
    col = db[OUTPUT_COLLECTION]
    inserted = 0
    for _, row in df_latest.iterrows():
        doc = {
            "employee_id": row["employee_id"],
            "year": int(latest_year),                
            "predicting_for_year": int(latest_year + 1), 
            "predicted_attrition_risk": float(row["predicted_attrition_risk"]),
            "prediction_type": "next_period_risk",
            "features": {k: (None if pd.isna(row[k]) else row[k]) for k in features},
            "predicted_at": datetime.utcnow()
        }
        col.update_one(
            {"employee_id": row["employee_id"], "year": int(latest_year)},
            {"$set": doc},
            upsert=True
        )
        inserted += 1

    print(f"Saved {inserted} attrition predictions for year {latest_year}")


if __name__ == "__main__":
    predict_latest_year()
