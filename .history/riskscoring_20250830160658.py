#calculaing rolling sums 
df["rain_7d"] = df["rainfall_mm"].rolling(7).sum()
df["rain_30d"] = df["rainfall_mm"].rolling(30).sum()
