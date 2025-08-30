import pandas as pd
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Load cleaned rainfall JSON
df = pd.read_json("rainfall_clean.json")

#Step 1: Create a drought label (weakly supervised)
threshold = df["rain_30d"].quantile(0.2)   # lowest 20% of 30-day rainfall
df["drought_label"] = (df["rain_30d"] < threshold).astype(int)

#Step 2: Feature engineering
# Anomaly feature (z-score style)
monthly_mean = df.groupby(df["date"].dt.month)["rainfall_mm"].transform("mean")
monthly_std = df.groupby(df["date"].dt.month)["rainfall_mm"].transform("std")
df["rain_anomaly"] = (df["rainfall_mm"] - monthly_mean) / monthly_std

features = ["rain_7d", "rain_30d", "rain_anomaly"]
X = df.dropna()[features]
y = df.dropna()["drought_label"]

#Step 3: Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, shuffle=False
)

#Step 4: Train Random Forest
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=6,
    random_state=42,
    class_weight="balanced"
)
rf.fit(X_train, y_train)

# Step 5: Predict drought risk ---
df["risk_prob"] = rf.predict_proba(X)[:, 1]

# Map probabilities → 5 risk classes
df["risk_class"] = pd.qcut(df["risk_prob"], 5, labels=[1,2,3,4,5])

# --- Step 6: Save results for dashboard use ---
df.to_csv("rainfall_with_risk.csv", index=False)
