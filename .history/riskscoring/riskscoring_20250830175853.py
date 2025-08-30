import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# --------- CONFIG ---------
DATA_DIR = Path("/Users/chenshihchi1/Desktop/SYNCS-HACK-2025/weather data")  # folder with raw station JSONs
POP_CSV  = DATA_DIR / "population.csv"                                       # station_name,population
OUT_DIR  = DATA_DIR / "out"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# --------- HELPERS ---------
MONTH_FIX = {
    # handle common variants; pandas uses %B for English month names
    "jan": "January", "january": "January",
    "feb": "February", "february": "February",
    "mar": "March", "march": "March",
    "apr": "April", "april": "April",
    "may": "May",
    "jun": "June", "june": "June",
    "jul": "July", "july": "July",
    "aug": "August", "august": "August",
    "sep": "September", "sept": "September", "september": "September",
    "oct": "October", "october": "October",
    "nov": "November", "november": "November",
    "dec": "December", "december": "December",
}

def norm_month_name(name: str) -> str:
    if not isinstance(name, str):
        name = str(name)
    key = name.strip().lower()
    return MONTH_FIX.get(key, name.strip())

def flatten_station_json(path: Path) -> pd.DataFrame:
    """Flatten ONE raw station JSON (nested years->MonthName->day) to rows."""
    with open(path, "r") as f:
        data = json.load(f)

    station_num  = str(data.get("stationNum", "")).strip()
    station_name = str(data.get("stationName", "")).strip()
    years = data.get("years", {})

    rows = []
    for year, months in years.items():
        for month_name_raw, days in months.items():
            month_name = norm_month_name(month_name_raw)
            for day_str, rainfall in (days or {}).items():
                # build date safely
                try:
                    day_int = int(day_str)
                except Exception:
                    continue
                # allow floats/ints/strings for rainfall
                try:
                    rain_val = float(rainfall)
                except Exception:
                    continue

                # Parse "YYYY-MonthName-DD" with %B
                date = pd.to_datetime(f"{year}-{month_name}-{day_int}",
                                      format="%Y-%B-%d", errors="coerce")
                if pd.isna(date):
                    continue

                rows.append({
                    "station_num": station_num,
                    "station_name": station_name,
                    "date": date,
                    "rainfall_mm": rain_val,
                })

    if not rows:
        return pd.DataFrame(columns=["station_num","station_name","date","rainfall_mm"])

    df = pd.DataFrame(rows).sort_values("date").reset_index(drop=True)
    return df

# --------- LOAD & FLATTEN ALL -------
all_frames = []
json_files = sorted([p for p in DATA_DIR.glob("*.json") if p.name != POP_CSV.name])
if not json_files:
    raise FileNotFoundError(f"No JSON files found in {DATA_DIR}")

for fp in json_files:
    df_i = flatten_station_json(fp)
    if df_i.empty:
        print(f"Warning: no rows parsed from {fp.name}")
        continue
    all_frames.append(df_i)

df = pd.concat(all_frames, ignore_index=True)
df = df.sort_values(["station_name", "date"]).reset_index(drop=True)

# --------- ROLLING FEATURES (per station) --------
df["rain_7d"] = (
    df.groupby("station_name")["rainfall_mm"]
      .rolling(7, min_periods=1).sum().reset_index(level=0, drop=True)
)
df["rain_30d"] = (
    df.groupby("station_name")["rainfall_mm"]
      .rolling(30, min_periods=1).sum().reset_index(level=0, drop=True)
)

# --------- POPULATION MERGE -------
pop = pd.read_csv(POP_CSV)
pop["station_name"] = pop["station_name"].astype(str).str.strip()
df["station_name"] = df["station_name"].astype(str).str.strip()

df = df.merge(pop.rename(columns={"population":"population_2025"}),
              on="station_name", how="left")
if df["population_2025"].isna().any():
    df["population_2025"] = df["population_2025"].fillna(df["population_2025"].median())

# --------- LABELS: station-specific (lowest 20% of rain_30d within station) -------
q20 = df.groupby("station_name")["rain_30d"].transform(lambda s: s.quantile(0.20))
df["drought_label"] = (df["rain_30d"] < q20).astype(int)

# ------- ANOMALY: monthly z-score within station ---------
month_idx = df["date"].dt.month
grp = df.groupby(["station_name", month_idx])
monthly_mean = grp["rainfall_mm"].transform("mean")
monthly_std  = grp["rainfall_mm"].transform("std").replace(0, 1.0)
df["rain_anomaly"] = (df["rainfall_mm"] - monthly_mean) / monthly_std

# ----- MODEL ---------
features = ["rain_7d", "rain_30d", "rain_anomaly", "population_2025"]
model_df = df.dropna(subset=features + ["drought_label"]).copy()

X = model_df[features]
y = model_df["drought_label"]

# simple time-ordered split across all stations
split_idx = int(len(model_df) * 0.8)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    random_state=42,
    class_weight="balanced_subsample",
    n_jobs=-1
)
rf.fit(X_train, y_train)

# --------- PREDICT + BIN (robust) ---------
model_df["risk_prob"] = rf.predict_proba(model_df[features])[:, 1]

# robust 1..5 classes via percentile rank (avoids qcut duplicate-edge errors)
q = model_df["risk_prob"].rank(pct=True, method="average")
model_df["risk_class"] = np.ceil(q * 5).astype(int)
model_df.loc[model_df["risk_class"] < 1, "risk_class"] = 1
model_df.loc[model_df["risk_class"] > 5, "risk_class"] = 5

# impact score = hazard × exposure (population normalised 0–1)
pop_min = model_df["population_2025"].min()
pop_ptp = max(model_df["population_2025"].max() - pop_min, 1.0)
model_df["pop_norm_01"] = (model_df["population_2025"] - pop_min) / pop_ptp
model_df["impact_score"] = model_df["risk_prob"] * model_df["pop_norm_01"]

# --------- SAVE ---------
combined = model_df.sort_values(["station_name", "date"])
combined_out = OUT_DIR / "all_stations_risk_with_population.csv"
combined.to_csv(combined_out, index=False)
print(f"Saved combined results → {combined_out}")

for stn, g in combined.groupby("station_name", sort=True):
    safe = "".join(c for c in stn if c.isalnum() or c in (" ","_","-")).strip().replace(" ", "_")
    (OUT_DIR / f"{safe}_risk.csv").write_text(g.to_csv(index=False))
print(f"Saved per-station CSVs to {OUT_DIR}")
