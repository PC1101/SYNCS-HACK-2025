import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# -----------------------------
# Paths
# -----------------------------
DATA_DIR = Path("/Users/chenshihchi1/Desktop/SYNCS-HACK-2025/weather data")
POP_CSV  = Path("/Users/chenshihchi1/Desktop/SYNCS-HACK-2025/weather data/population.csv")
OUT_DIR  = Path("/Users/chenshihchi1/Desktop/SYNCS-HACK-2025/weather data/out")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# -----------------------------
# Load all JSON files in folder
# (expects each JSON to have at least: date, rainfall_mm, rain_7d, rain_30d, station_name)
# If rain_7d/30d are missing, we compute them per station.
# -----------------------------
frames = []
json_files = sorted(DATA_DIR.glob("*.json"))

if not json_files:
    raise FileNotFoundError(f"No JSON files found in {DATA_DIR}")

for fp in json_files:
    try:
        df_i = pd.read_json(fp)
    except ValueError:
        # some files may be NDJSON; try lines=True
        df_i = pd.read_json(fp, lines=True)

    # Ensure required columns exist
    if "date" not in df_i.columns:
        # try to infer/construct if needed
        raise ValueError(f"'date' column missing in {fp.name}")
    df_i["date"] = pd.to_datetime(df_i["date"])

    if "station_name" not in df_i.columns:
        # if you only have station_num, adapt this to map to names instead
        raise ValueError(f"'station_name' column missing in {fp.name}")

    # Standardize station_name formatting
    df_i["station_name"] = df_i["station_name"].astype(str).str.strip()

    # Ensure rainfall_mm present
    if "rainfall_mm" not in df_i.columns:
        # Sometimes column might be called 'rainfall' — adjust if needed
        if "rainfall" in df_i.columns:
            df_i = df_i.rename(columns={"rainfall": "rainfall_mm"})
        else:
            raise ValueError(f"'rainfall_mm' column missing in {fp.name}")

    # If rolling features missing, compute per station (sorted by date)
    if ("rain_7d" not in df_i.columns) or ("rain_30d" not in df_i.columns):
        df_i = df_i.sort_values(["station_name", "date"]).reset_index(drop=True)
        df_i["rain_7d"] = (
            df_i.groupby("station_name")["rainfall_mm"]
                .rolling(7, min_periods=1).sum().reset_index(level=0, drop=True)
        )
        df_i["rain_30d"] = (
            df_i.groupby("station_name")["rainfall_mm"]
                .rolling(30, min_periods=1).sum().reset_index(level=0, drop=True)
        )

    frames.append(df_i)

# Combine all stations
df = pd.concat(frames, ignore_index=True).sort_values(["station_name", "date"]).reset_index(drop=True)

# -----------------------------
# Merge population (2025)
# -----------------------------
pop = pd.read_csv(POP_CSV)
pop["station_name"] = pop["station_name"].astype(str).str.strip()

df = df.merge(pop.rename(columns={"population": "population_2025"}),
              on="station_name", how="left")

# Impute missing populations by global median (or set 0 if you prefer)
if df["population_2025"].isna().any():
    df["population_2025"] = df["population_2025"].fillna(df["population_2025"].median())

# -----------------------------
# Labels: station-specific drought labels
# Define drought = 1 if rain_30d is in the lowest 20% *within that station*
# -----------------------------
station_q20 = (
    df.groupby("station_name")["rain_30d"]
      .transform(lambda s: s.quantile(0.20))
)
df["drought_label"] = (df["rain_30d"] < station_q20).astype(int)

# -----------------------------
# Feature engineering: station-specific monthly anomaly
# Compute monthly mean/std within each station to avoid cross-station bias
# -----------------------------
month_idx = df["date"].dt.month
grp = df.groupby(["station_name", month_idx])

monthly_mean = grp["rainfall_mm"].transform("mean")
monthly_std  = grp["rainfall_mm"].transform("std").replace(0, 1.0)  # avoid div by zero
df["rain_anomaly"] = (df["rainfall_mm"] - monthly_mean) / monthly_std

# -----------------------------
# Model features
# -----------------------------
features = ["rain_7d", "rain_30d", "rain_anomaly", "population_2025"]

model_df = df.dropna(subset=features + ["drought_label"]).copy()
X = model_df[features]
y = model_df["drought_label"]

# Time-aware split: keep temporal order across all stations
# (simple approach for hackathon; can be refined per-station if needed)
# Use last 20% as test
split_idx = int(len(model_df) * 0.8)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

# -----------------------------
# Train Random Forest
# -----------------------------
rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    random_state=42,
    class_weight="balanced_subsample",
    n_jobs=-1
)
rf.fit(X_train, y_train)

# -----------------------------
# Predict risk on all rows with features
# -----------------------------
model_df["risk_prob"] = rf.predict_proba(model_df[features])[:, 1]

# Robust 1–5 risk classes using rank-based binning
# (avoids qcut duplicate-edge errors when many probs are identical)
q = model_df["risk_prob"].rank(pct=True, method="average")
model_df["risk_class"] = np.ceil(q * 5).astype(int)
model_df.loc[model_df["risk_class"] < 1, "risk_class"] = 1
model_df.loc[model_df["risk_class"] > 5, "risk_class"] = 5

# Impact score = hazard × exposure (population normalized 0–1)
pop_min = model_df["population_2025"].min()
pop_ptp = model_df["population_2025"].max() - pop_min
model_df["pop_norm_01"] = (model_df["population_2025"] - pop_min) / (pop_ptp if pop_ptp else 1.0)
model_df["impact_score"] = model_df["risk_prob"] * model_df["pop_norm_01"]

# -----------------------------
# Save combined + per-station outputs
# -----------------------------
combined_out = model_df.sort_values(["station_name", "date"])
combined_path = OUT_DIR / "all_stations_risk_with_population.csv"
combined_out.to_csv(combined_path, index=False)
print(f"Saved combined results → {combined_path}")

# Per-station files (optional)
for stn, df_stn in combined_out.groupby("station_name", sort=True):
    safe_name = "".join(c for c in stn if c.isalnum() or c in (" ","_","-")).strip().replace(" ", "_")
    out_path = OUT_DIR / f"{safe_name}_risk.csv"
    df_stn.to_csv(out_path, index=False)

print(f"Saved per-station CSVs to {OUT_DIR}")
