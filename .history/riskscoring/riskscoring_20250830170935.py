import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Load rainfall features (already has date, rainfall_mm, rain_7d, rain_30d, station_name, etc.)
df = pd.read_json("rainfall_clean_testing.json")

# Load 2025 population (suburb-level)
pop = pd.read_csv("population.csv")

# Clean keys to avoid join issues (trim spaces, consistent casing)
df["station_name"] = df["station_name"].astype(str).str.strip()
pop["station_name"] = pop["station_name"].astype(str).str.strip()

# Merge population into the rainfall frame
df = df.merge(pop.rename(columns={"population": "population_2025"}),
              on="station_name", how="left")

# Impute any missing population (e.g., if a station isn't in your CSV)
if df["population_2025"].isna().any():
    df["population_2025"] = df["population_2025"].fillna(df["population_2025"].median())

# -------------------------
# Step 1: Create a drought label (weakly supervised)
threshold = df["rain_30d"].quantile(0.20)  # lowest 20% of 30-day rainfall
df["drought_label"] = (df["rain_30d"] < threshold).astype(int)

# -------------------------
# Step 2: Feature engineering (anomaly vs monthly norm)
monthly_mean = df.groupby(df["date"].dt.month)["rainfall_mm"].transform("mean")
monthly_std  = df.groupby(df["date"].dt.month)["rainfall_mm"].transform("std").replace(0, 1.0)
df["rain_anomaly"] = (df["rainfall_mm"] - monthly_mean) / monthly_std

# -------------------------
# Step 3: Train/test split
# Add population feature to the model
features = ["rain_7d", "rain_30d", "rain_anomaly", "population_2025"]

# Drop rows with any NA in required features/label
model_df = df.dropna(subset=features + ["drought_label"]).copy()
X = model_df[features]
y = model_df["drought_label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, shuffle=False
)

# -------------------------
# Step 4: Train Random Forest
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=6,
    random_state=42,
    class_weight="balanced"
)
rf.fit(X_train, y_train)

# -------------------------
# Step 5: Predict drought risk (probability) on all rows where features are present
model_df["risk_prob"] = rf.predict_proba(model_df[features])[:, 1]

# Map probabilities -> 5 risk classes (quantile buckets over current distribution)
model_df["risk_class"] = pd.qcut(model_df["risk_prob"], 5, labels=[1,2,3,4,5])

# Optional: impact-aware prioritization (hazard × exposure)
# Normalize population to [0,1] then multiply by risk probability
pop_min = model_df["population_2025"].min()
pop_ptp = model_df["population_2025"].max() - pop_min
model_df["pop_norm_01"] = (model_df["population_2025"] - pop_min) / (pop_ptp if pop_ptp else 1.0)
model_df["impact_score"] = model_df["risk_prob"] * model_df["pop_norm_01"]

# -------------------------
# Step 6: Save results for dashboard use
# Join back to original df shape (optional) so you still have all rows
out = df.merge(
    model_df[["date","station_name","risk_prob","risk_class","impact_score"]],
    on=["date","station_name"], how="l_]()
