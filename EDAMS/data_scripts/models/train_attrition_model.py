# train_attrition_model.py
import sys
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import random

# ---------------- Paths ----------------
BASE_DIR = os.path.dirname(__file__)
FEATURE_CSV = os.path.join(BASE_DIR, "attrition_features.csv")
MODEL_PATH = os.path.join(BASE_DIR, "attrition_model.joblib")
FEATURE_LIST_PATH = os.path.join(BASE_DIR, "feature_list.txt")
PREDICTION_CSV_TEMPLATE = os.path.join(BASE_DIR, "predicted_attrition_{}.csv")

# ---------------- Seed for reproducibility ----------------
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

# ---------------- Training ----------------
def train():
    # Load features
    if not os.path.exists(FEATURE_CSV):
        print("Feature CSV not found. Run ETL first.")
        return

    df = pd.read_csv(FEATURE_CSV)
    if df.empty:
        print("Feature CSV is empty.")
        return

    # ---------------- Feature selection ----------------
    numeric_features = [
        "EES_overall_norm", "JSS_overall_norm", "LIS_overall_norm",  # normalized scores
        "EES_prev", "JSS_prev", "LIS_prev",
        "delta_EES", "delta_JSS", "delta_LIS",
        "tenure_years", "num_surveys_year"
    ]
    numeric_features = [c for c in numeric_features if c in df.columns]

    categorical_features = [c for c in ["department", "role"] if c in df.columns]

    # Drop rows where all numeric features are missing
    df = df[df[numeric_features].notnull().any(axis=1)]

    # ---------------- Prepare X and y ----------------
    X = df[numeric_features + categorical_features]
    y = df["attrition_next_year"].astype(int)

    # ---------------- Temporal split ----------------
    latest_year = df["year"].max()
    train_df = df[df["year"] < latest_year]
    test_df = df[df["year"] == latest_year]

    print(f"Training on {len(train_df)} rows, testing on {len(test_df)} rows (year {latest_year})")

    X_train = train_df[numeric_features + categorical_features]
    y_train = train_df["attrition_next_year"].astype(int)
    X_test = test_df[numeric_features + categorical_features]
    y_test = test_df["attrition_next_year"].astype(int)

    # ---------------- Preprocessing ----------------
    numeric_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="median"))
    ])
    categorical_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="UNKNOWN")),
        ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    preprocessor = ColumnTransformer([
        ("num", numeric_transformer, numeric_features),
        ("cat", categorical_transformer, categorical_features)
    ])

    # ---------------- Model pipeline ----------------
    model = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(
            n_estimators=300,
            random_state=RANDOM_SEED,
            n_jobs=-1,
            class_weight="balanced"
        ))
    ])

    # Train model
    model.fit(X_train, y_train)

    # Predict on latest year
    y_pred = model.predict(X_test)

    # Predict probabilities safely
    try:
        y_proba_raw = model.predict_proba(X_test)
        if y_proba_raw.shape[1] == 2:
            y_proba = y_proba_raw[:, 1]
        else:  # single class only
            single_class = model.classes_[0]
            y_proba = np.ones(len(X_test)) if single_class == 1 else np.zeros(len(X_test))
            print("Warning: Only one class present in test set; ROC AUC cannot be computed.")
    except Exception as e:
        y_proba = np.zeros(len(X_test))
        print(f"Warning: Could not compute probabilities: {e}")

    # ---------------- Evaluation ----------------
    print(f"\nEvaluation on year {latest_year}:")
    print(classification_report(y_test, y_pred, zero_division=0))

    if len(set(y_test)) > 1 and "y_proba" in locals():
        try:
            print("ROC AUC:", roc_auc_score(y_test, y_proba))
        except Exception:
            print("ROC AUC could not be computed.")

    # ---------------- Save model ----------------
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    # Save feature list
    with open(FEATURE_LIST_PATH, "w") as f:
        f.write(",".join(numeric_features + categorical_features))
    print(f"Feature list saved to {FEATURE_LIST_PATH}")

    # Save predictions
    test_df = test_df.copy()
    test_df["predicted_attrition_risk"] = y_proba
    output_csv = PREDICTION_CSV_TEMPLATE.format(latest_year)
    test_df.to_csv(output_csv, index=False)
    print(f"Predictions saved to {output_csv}")


if __name__ == "__main__":
    train()
