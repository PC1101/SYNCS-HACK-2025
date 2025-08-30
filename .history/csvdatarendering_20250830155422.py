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
with open("rain_json_066006_2015_2025.json", "r") as f:
    data = json.load(f)
    
    
#library to display heat map 
#general models for AI 

import json
import pandas as pd

# Load JSON
with open("rain_json_066006_2015_2025.json", "r") as f:
    data = json.load(f)

records = []
for year, months in data["years"].items():
    for month, days in months.items():
        for day, rainfall in days.items():
            records.append({
                "date": pd.to_datetime(f"{year}-{month}-{day}"),
                "rainfall_mm": rainfall
            })

df = pd.DataFrame(records).sort_values("date").reset_index(drop=True)
