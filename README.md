ChatGPT said:
🌱 UrbanOasis — Sydney 2050

An all-in-one tool for rainwater recycling optimisation

Frontend: Vite + React + TypeScript + Tailwind + Recharts
Backend: Express (Node 18+), optional OpenAI GPT integration

🚩 Problem Overview

Sydney receives regular rainfall, yet only ~⅓ of suitable homes use rainwater tanks, and those save ~21% of household demand (Sydney Water, 2013). Many tanks sit full during major rains (Kingspan, 2020), while default sizing can be uneconomic (Rahman, 2012). We lack tools that turn rainfall data into proactive water-allocation decisions.

💡 Our Solution

Provides updated rainfall data by station (using prepared BoM JSONs).

Estimates drought risk probability from historical rainfall + population.

Converts risk into five classes (1–5) and shows a heatmap.

Surfaces insights in a dashboard and a chat assistant (local JSON first, GPT fallback).

📊 Data Sources

Rainfall: Bureau of Meteorology (BoM) NSW station records

Population: Australian Bureau of Statistics (ABS)

⚠️ This app reads prepared JSON from public/data/. Use BoM/ABS data according to their terms.

🔬 Methodology (Model Overview)

Preprocessing: Flatten station JSON (year → month → day), compute rolling rainfall (7/30-day).

Drought Labels: Drought = lowest 20% of historical 30-day rainfall per station.

Features: Monthly anomaly (z-score), population exposure (2025).

Model: Random Forest (binary drought vs. not); probability → 5 classes.

Impact Score: Risk × Normalised Population to highlight hotspots.

✨ App Features

Sticky header anchors: Dashboard, Resources, Climate, Planning

Dashboard KPIs + activity feed

Climate / Planning / Mobility / Resources: clear card-based sections

Rainfall Analytics

Loads station JSONs from /public/data (e.g. rain_json_066214_2015_2025.json)

Compares monthly averages across stations (toggle stations on/off)

Heatmap visualises relative drought risk (from model output)

Chat Assistant

Answers rainfall queries from local JSON first

Falls back to OpenAI GPT for general Q&A (if API key set)

🗂️ Project Structure
server/
index.ts          # Express server (chat + rainfall + meta APIs)
rainfall.ts       # Loads/aggregates station JSON from /public/data
src/
App.tsx
components/
AverageRainfall.tsx
Header.tsx
Hero.tsx
DashboardOverview.tsx
ClimateAction.tsx
SmartMobility.tsx
UrbanPlanning.tsx
ResourceManagement.tsx
FutureWork.tsx
Footer.tsx
public/
data/
rain_json_<STATION>_<FROM>_<TO>.json
heatmap.png

🧩 Prerequisites

Node 18+

npm (or pnpm/yarn)

⚙️ Setup
1) Install
   npm i

2) Data Files

Place prepared files under:

public/data/
rain_json_066214_2015_2025.json
rain_json_066160_2015_2025.json
...
heatmap.png


JSON schema (example):

{
"stationNum": "066214",
"stationName": "Sydney (Observatory Hill) NSW",
"years": {
"2019": {
"January": { "1": 12.4, "2": 0, "3": 5.0 },
"February": { "1": 3.2 }
}
}
}


Filenames must follow: rain_json_<STATION>_<FROM_YEAR>_<TO_YEAR>.json.
AverageRainfall.tsx defaults to FROM_YEAR = 2015 and TO_YEAR = current year; keep filenames consistent, or update those constants.

3) (Optional) OpenAI

Create .env in project root:

OPENAI_API_KEY=sk-...
PORT=8787


Without a key, the chat will still answer structured rainfall questions from local JSON, but not general GPT prompts.

🏃 Run

Local (two processes via proxy):

npm run dev:local


Frontend: http://localhost:5173

API: http://localhost:8787

Vite proxies /api/* → Express (see vite.config.ts).

Tunnel/HMR (optional):

npm run dev:tunnel


Uses VITE_TUNNEL_HOST=urbanoasis.apdcrew.com for HTTPS HMR over a tunnel.

Available scripts (from package.json):

{
"dev": "vite",
"dev:server": "tsx server/index.ts",
"dev:web": "vite",
"dev:all": "concurrently -k -n server,web \"npm:dev:server\" \"npm:dev:web\"",
"build": "vite build",
"lint": "eslint .",
"preview": "vite preview",
"dev:local": "npm run dev:all",
"dev:tunnel": "VITE_TUNNEL_HOST=urbanoasis.apdcrew.com npm run dev:all"
}

🔌 APIs
Health
GET /api/health
→ { "ok": true, "ts": 1712345678901 }

Rainfall (local JSON)
POST /api/rainfall
Content-Type: application/json
{ "stationNum": "066214", "year": "2023", "month": "March" }


Responses

Per-year totals (no year):

{
"stationNum":"066214",
"stationName":"Sydney...",
"perYear": { "2019": { "total_mm": 820.3 }, "2020": { "total_mm": 905.1 } }
}


Year summary:

{
"stationNum":"066214",
"stationName":"Sydney...",
"year":"2023",
"total_mm":965.2,
"avg_monthly_mm":80.4,
"monthly_totals_mm":{"January":50.0,"February":72.3,"...":90.1}
}


Month summary:

{ "stationNum":"066214","stationName":"Sydney...","year":"2023","month":"March","total_mm":85.7 }

Dataset Meta
GET /api/rainfall/meta


Returns { stationCount, stations: [{ stationNum, fromYear, toYear, file }], global: { fromYear, toYear, lastModified } }.

Chat
POST /api/chat
Content-Type: application/json
{ "messages": [ { "role":"user", "content":"066214 2023 total" } ] }


Server first tries to parse a rainfall intent and answer from local JSON.

Otherwise, streams GPT output (requires OPENAI_API_KEY).

cURL (stream):

curl -N -X POST http://localhost:8787/api/chat \
-H "Content-Type: application/json" \
-d '{"messages":[{"role":"user","content":"Hello"}]}'

🖼️ Rainfall Section (Frontend Details)

AverageRainfall.tsx

Fetches per-station JSONs from /public/data.

Computes monthly averages across all available years per station.

Renders a multi-station bar chart (toggle stations).

Shows average annual rainfall and wettest month per station.

Heatmap:

If using public file:

<img src="/data/heatmap.png" alt="Rainfall heatmap" />


If bundling from src/assets:

import heatmapPng from "../assets/heatmap.png";
<img src={heatmapPng} alt="Rainfall heatmap" />


If the image loads locally but not on a hosted domain, ensure the deployed base path is correct or switch to the bundled import.

🌐 Impact

Prioritises high-risk, high-population suburbs for water policy.

Enables smarter allocation and climate-resilient planning.

Communicates clearly via a data-driven UI and chat.

🚀 Future Work

Add temperature, soil moisture, evaporation features.

Expand dashboard to energy and sewage metrics.

Automate BoM ingestion to refresh JSONs on a schedule.

👩‍💻 Team

Josh Morton

Jie Yong

Paul Chen

🛠️ Troubleshooting

/api/chat → 404: Run npm run dev:local. Ensure Vite proxy targets http://localhost:8787.

429 (OpenAI): Add credit or select the correct project for your API key.

Heatmap not visible: Check path (/data/heatmap.png) or use import heatmapPng.

JSON not loading: Ensure filename pattern and FROM_YEAR/TO_YEAR match the code or update constants.

⚖️ Notes

Demo/PoC. Respect BoM/ABS licenses. OpenAI usage is optional and billed separately.