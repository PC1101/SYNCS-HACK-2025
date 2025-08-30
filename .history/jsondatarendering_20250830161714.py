# Clean and convert to the input format we want: date + rainfall
import json
import pandas as pd

# # Load the uploaded CSV
# file_path = "/Users/chenshihchi1/Desktop/SYNCS-HACK-2025/Testing Rainfall.csv"
# df = pd.read_csv(file_path)

# # Step 1: Create a proper datetime column
# df["date"] = pd.to_datetime(dict(year=df["Year"], month=df["Month"], day=df["Day"]))

# # Step 2: Keep only relevant columns: date, rainfall
# df_clean = df[["date", "Rainfall amount (millimetres)"]].rename(columns={"Rainfall amount (millimetres)": "rainfall_mm"})

# # Step 3: Sort by date (in case not already)
# df_clean = df_clean.sort_values("date").reset_index(drop=True)

# # Step 4: Add rolling aggregates for features (optional for ML)
# df_clean["rain_7d"] = df_clean["rainfall_mm"].rolling(7).sum()
# df_clean["rain_30d"] = df_clean["rainfall_mm"].rolling(30).sum()
# df_clean.head(20)

#load json 
import json
import pandas as pd
from pathlib import Path

# ----- Inputs -----
in_path = Path("/Users/chenshihchi1/Downloads/weather data/rain_json_066006_2015_2025 2.json")
out_csv = Path("rainfall_clean.csv")
out_json = Path("rainfall_clean.json")

# ----- Load JSON -----
with open(in_path, "r") as f:
    data = json.load(f)

station_num = data.get("stationNum")
station_name = data.get("stationName")
years_dict = data["years"]

# ----- Flatten year → month (name) → day → rainfall -----
records = []
for year, months in years_dict.items():
    for month_name, days in months.items():
        # month_name is like "January", "February", ...
        for day_str, rainfall in days.items():
            # Build a proper date; enforce month-name parsing with %B
            # (day can be stored as string in JSON; cast to int)
            date = pd.to_datetime(f"{year}-{month_name}-{int(day_str)}", format="%Y-%B-%d", errors="coerce")
            if pd.isna(date):
                continue  # skip malformed rows just in case

            records.append({
                "station_num": station_num,
                "station_name": station_name,
                "date": date,
                "rainfall_mm": rainfall
            })

# ----- DataFrame + sorting -----
df = pd.DataFrame(records).sort_values("date").reset_index(drop=True)

# (Optional) Add rolling features for modeling
if not df.empty:
    df["rain_7d"] = df["rainfall_mm"].rolling(7, min_periods=1).sum()
    df["rain_30d"] = df["rainfall_mm"].rolling(30, min_periods=1).sum()

# ----- Save outputs -----
df.to_csv(out_csv, index=False)
df.to_json(out_json, orient="records", date_format="iso")

print(f"Rows: {len(df)}")
print(f"Wrote: {out_csv.resolve()}")
print(f"Wrote: {out_json.resolve()}")
