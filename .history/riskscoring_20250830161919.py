from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
#calculaing rolling sums 

features = ["rain_7d", "rain_30d", "rain_anomaly"]
X = df.dropna()[features]
y = df.dropna()["drought_label"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

rf = RandomForestClassifier(n_estimators=200, max_depth=6, random_state=42)
rf.fit(X_train, y_train)

df["risk_prob"] = rf.predict_proba(X[features])[:,1]
df["risk_class"] = pd.qcut(df["risk_prob"], 5, labels=[1,2,3,4,5])