from sklearn.ensemble import RandomForestClassifier
from sklearn.model
#calculaing rolling sums 
df["rain_7d"] = df["rainfall_mm"].rolling(7).sum()
df["rain_30d"] = df["rainfall_mm"].rolling(30).sum()

#SPI Standardised Percipitation Index
monthly_mean = df.groupby(df["date"].dt.month)["rainfall_mm"].transform("mean")
monthly_std = df.groupby(df["date"].dt.month)["rainfall_mm"].transform("std")
df["rain_anomaly"] = (df["rainfall_mm"] - monthly_mean) / monthly_std
