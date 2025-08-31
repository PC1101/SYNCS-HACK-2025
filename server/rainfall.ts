// server/rainfall.ts
import fs from "fs";
import path from "path";

// If you start the server from the project root (npm run dev:server),
// process.cwd() === project root, so this points to project-root/public/data
const DATA_DIR = path.join(process.cwd(), "public", "data");

type Years = Record<string, Record<string, Record<string, number>>>;
// years -> MonthName -> Day("1".."31") -> mm
type Store = {
    stationNum: string;
    stationName?: string;
    years: Years;
};

function monthTotal(days: Record<string, number>) {
    return Object.values(days).reduce((a, b) => a + b, 0);
}
function yearTotal(months: Record<string, Record<string, number>>) {
    return Object.values(months).reduce((a, m) => a + monthTotal(m), 0);
}
function yearMonthlyAverages(months: Record<string, Record<string, number>>) {
    const monthNames = Object.keys(months);
    const monthlyTotals = monthNames.map((m) => monthTotal(months[m]));
    const avg = monthlyTotals.reduce((a, b) => a + b, 0) / (monthNames.length || 1);
    return { monthlyTotals, avgMonthly: avg };
}

// Load a station JSON file. If multiple files exist (e.g. different year ranges),
// we pick the lexicographically last one (usually the newest).
export function loadStation(stationNum: string): Store | null {
    if (!fs.existsSync(DATA_DIR)) return null;
    const files = fs
        .readdirSync(DATA_DIR)
        .filter((f) => f.includes(stationNum) && f.endsWith(".json"));

    if (!files.length) return null;

    const latest = files.sort().at(-1)!; // e.g. "rain_json_066006_2015_2025.json"
    const raw = fs.readFileSync(path.join(DATA_DIR, latest), "utf8");
    return JSON.parse(raw);
}

// Main API used by your /api/rainfall route
export function getRainfallSummary(params: {
    stationNum: string;
    year?: string;            // "2019"
    month?: string;           // "January".."December"
}) {
    const data = loadStation(params.stationNum);
    if (!data) return { error: "Station not found or no JSON files in /public/data." };

    const { stationNum, stationName, years } = data;

    // No year: return per-year totals across all years in the file
    if (!params.year) {
        const perYear = Object.fromEntries(
            Object.entries(years).map(([y, months]) => [y, { total_mm: yearTotal(months) }])
        );
        return { stationNum, stationName, perYear };
    }

    const y = years[params.year];
    if (!y) return { error: `No data for year ${params.year}` };

    // Year only: return total + monthly totals + average monthly
    if (!params.month) {
        const { monthlyTotals, avgMonthly } = yearMonthlyAverages(y);
        const monthlyByName = Object.fromEntries(
            Object.keys(y).map((name, i) => [name, monthlyTotals[i]])
        );
        return {
            stationNum,
            stationName,
            year: params.year,
            total_mm: yearTotal(y),
            avg_monthly_mm: avgMonthly,
            monthly_totals_mm: monthlyByName,
        };
    }

    // Year + month: return that month's total
    const m = y[params.month];
    if (!m) return { error: `No data for ${params.month} ${params.year}` };

    return {
        stationNum,
        stationName,
        year: params.year,
        month: params.month,
        total_mm: monthTotal(m),
    };
}
