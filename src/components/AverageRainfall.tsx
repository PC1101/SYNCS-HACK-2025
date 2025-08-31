import React, { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";
import { Droplets, Loader2 } from "lucide-react";

// --- Configure your JSON location ---
// Place your generated JSON files in your app's /public/data folder with names like:
//   rain_json_066006_2015_2025.json
//   rain_json_066214_2015_2025.json
// (2015 to current year). The component will attempt to fetch each file by pattern.
const DATA_ROOT = "/data"; // served from /public/data
const FROM_YEAR = 2015;
const TO_YEAR = new Date().getFullYear();

// Stations list (matches your scraping list)
const STATIONS: { stationNumber: string; stationName: string }[] = [
    { stationNumber: "066214", stationName: "Sydney (Observatory Hill)" },
    { stationNumber: "066160", stationName: "Centennial Park" },
    { stationNumber: "066052", stationName: "Randwick (Randwick St)" },
    { stationNumber: "066098", stationName: "Rose Bay (RSGC)" },
    { stationNumber: "066034", stationName: "Abbotsford (Blackwell Point Rd)" },
    { stationNumber: "066011", stationName: "Chatswood Bowling Club" },
    { stationNumber: "066036", stationName: "Marrickville Golf Club" },
    {stationNumber: '066037', stationName:'Sydney Airport AMO NSW'},
    {stationNumber: '066194', stationName:'Canterbury Racecourse AWS NSW'},
    {stationNumber: '067111', stationName:'North Parramatta (Burnside Homes) NSW'},
    {stationNumber: '066156', stationName:'Macquarie Park (Willandra Village) NSW'},
    {stationNumber: '056205', stationName:'Pinkett (Benbookra) NSW'},
    {stationNumber: '057103', stationName:'Kookabookra NSW'},
    {stationNumber: '057123', stationName:'Newton Boyd (Abbey Green) NSW'},
    {stationNumber: '057082', stationName:'Glen Innes (Mt Mitchell Forest) NSW'},
    {stationNumber: '056161', stationName:'Guyra (Gowan Brae) NSW'},
    {stationNumber: '057014', stationName:'Glen Elgin (Glenbrook) NSW'},
    {stationNumber: '057023', stationName:'Ebor (Wongwibinda) NSW'},
    {stationNumber: '056094', stationName:'Dundee (Wattle Dale) NSW'},
    {stationNumber: '066013', stationName:'Concord Golf Club NSW'},
    {stationNumber: '066126', stationName:'Collaroy (Long Reef Golf Club) NSW'},
    {stationNumber: '066120', stationName:'Gordon Golf Club NSW'},
    {stationNumber: '066059', stationName:'Terrey Hills AWS NSW'},
    {stationNumber: '066142', stationName:'Duffys Forest (Namba Rd) NSW'},
    {stationNumber: '066211', stationName:'Wahroonga (Ada Avenue) NSW'},
    {stationNumber: '067065', stationName:'Hornsby (Swimming Pool) NSW'},
    {stationNumber: '066119', stationName:'Mount Kuring-Gai (Ledora Farm) NSW'},
    {stationNumber: '067112', stationName:'North Rocks (Muirfield Golf Club) NSW'},
    {stationNumber: '066058', stationName:'Sans Souci (Public School) NSW'},
    {stationNumber: '066014', stationName:'Cronulla South Bowling Club NSW'},
    {stationNumber: '066141', stationName:'Mona Vale Golf Club NSW'},
    {stationNumber: '061294', stationName:'Avoca Beach Bowling Club NSW'},
    {stationNumber: '066148', stationName:'Peakhurst Golf Club NSW'},
    {stationNumber: '066161', stationName:'Holsworthy Aerodrome AWS NSW'},
    {stationNumber: '066176', stationName:'Audley (Royal National Park) NSW'},
    {stationNumber: '066078', stationName:'Lucas Heights (ANSTO) NSW'}

];

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

type MonthName = (typeof MONTHS)[number];

type StationJson = {
    stationNum: string;
    years: {
        [year: string]: {
            [month in MonthName]: { [day: string]: number };
        };
    };
};

// Nice distinct Tailwind color classes (Recharts uses inline fills)
const BAR_COLORS = [
    "#059669", // emerald-600
    "#2563EB", // blue-600
    "#7C3AED", // violet-600
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#0EA5E9", // sky-500
    "#10B981", // green-500
    "#8B5CF6", // violet-500
    "#F97316", // orange-500
];

function filePathFor(stationNumber: string) {
    return `${DATA_ROOT}/rain_json_${stationNumber}_${FROM_YEAR}_${TO_YEAR}.json`;
}

function sum(obj: Record<string, number> | undefined) {
    if (!obj) return 0;
    let s = 0;
    for (const k in obj) s += Number(obj[k] || 0);
    return s;
}

function computeMonthlyAverages(json: StationJson | null | undefined) {
    // Returns a map: monthName -> average monthly total across all years in the file
    const out: Record<MonthName, number> = {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
    };
    if (!json || !json.years) return out;

    const years = Object.keys(json.years);
    if (years.length === 0) return out;

    for (const m of MONTHS) {
        let total = 0;
        for (const y of years) {
            total += sum(json.years[y]?.[m]);
        }
        out[m] = total / years.length; // average monthly total (mm)
    }
    return out;
}

function computeAnnualAverage(json: StationJson | null | undefined) {
    if (!json || !json.years) return 0;
    const years = Object.keys(json.years);
    if (years.length === 0) return 0;

    let totalAcrossYears = 0;
    for (const y of years) {
        let annual = 0;
        for (const m of MONTHS) annual += sum(json.years[y]?.[m]);
        totalAcrossYears += annual;
    }
    return totalAcrossYears / years.length;
}

export const AverageRainfall: React.FC = () => {
    const [selectedStations, setSelectedStations] = useState(
        STATIONS.map((s) => s.stationNumber)
    );
    const [dataByStation, setDataByStation] = useState<
        Record<string, StationJson | null>
    >({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        Promise.all(
            STATIONS.map(async (s) => {
                const url = filePathFor(s.stationNumber);
                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const json: StationJson = await res.json();
                    return { key: s.stationNumber, json } as const;
                } catch (e) {
                    console.warn("Failed to load", url, e);
                    return { key: s.stationNumber, json: null } as const;
                }
            })
        ).then((all) => {
            if (cancelled) return;
            const next: Record<string, StationJson | null> = {};
            all.forEach((r) => (next[r.key] = r.json));
            setDataByStation(next);
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const chartData = useMemo(() => {
        // Build rows like: { month: 'January', '066006': 85.2, '066214': 91.0, ... }
        const rows: Array<any> = MONTHS.map((m) => ({ month: m }));

        for (const s of STATIONS) {
            const avg = computeMonthlyAverages(dataByStation[s.stationNumber]);
            for (let i = 0; i < MONTHS.length; i++) {
                const m = MONTHS[i];
                rows[i][s.stationNumber] = Number(avg[m]?.toFixed(2) || 0);
            }
        }
        return rows;
    }, [dataByStation]);

    const stationSummaries = useMemo(() => {
        return STATIONS.map((s) => {
            const json = dataByStation[s.stationNumber];
            const monthly = computeMonthlyAverages(json);
            const avgAnnual = computeAnnualAverage(json);

            // wettest month from averages
            let wettest: { month: MonthName; value: number } = { month: "January", value: 0 };
            for (const m of MONTHS) {
                const v = monthly[m];
                if (v > wettest.value) wettest = { month: m, value: v };
            }
            return {
                stationNumber: s.stationNumber,
                stationName: s.stationName,
                avgAnnual: Number(avgAnnual.toFixed(1)),
                wettest,
            };
        });
    }, [dataByStation]);

    const toggleStation = (id: string) => {
        setSelectedStations((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    return (
        <section id="rainfall" className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-100 mb-4">
                        <Droplets className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Average Rainfall (2015–{TO_YEAR})
                    </h2>
                    <p className="text-gray-600 max-w-3xl mx-auto">
                        Monthly average rainfall (mm) aggregated from BoM daily records for each station.
                    </p>
                </div>

                {/* Station toggles */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {STATIONS.map((s) => {
                        const active = selectedStations.includes(s.stationNumber);
                        return (
                            <button
                                key={s.stationNumber}
                                onClick={() => toggleStation(s.stationNumber)}
                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                                    active
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                                }`}
                                title={s.stationName}
                            >
                                {s.stationName}
                            </button>
                        );
                    })}
                </div>

                {/* Chart Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-10">
                    <div className="px-6 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Monthly Averages by Station
                        </h3>
                    </div>
                    <div className="h-[420px] w-full px-2 pb-6">
                        {loading ? (
                            <div className="h-full w-full flex items-center justify-center text-gray-500">
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading rainfall data…
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} label={{ value: "mm", angle: -90, position: "insideLeft", offset: 10 }} />
                                    <Tooltip formatter={(v: any) => `${v} mm`} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {STATIONS.map((s, idx) =>
                                        selectedStations.includes(s.stationNumber) ? (
                                            <Bar
                                                key={s.stationNumber}
                                                dataKey={s.stationNumber}
                                                name={s.stationName}
                                                fill={BAR_COLORS[idx % BAR_COLORS.length]}
                                                radius={[6, 6, 0, 0]}
                                            />
                                        ) : null
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Station summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stationSummaries
                        .filter((s) => selectedStations.includes(s.stationNumber))
                        .map((s, idx) => (
                            <div
                                key={s.stationNumber}
                                className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-gray-900 font-bold">{s.stationName}</h4>
                                    <span className="text-xs text-gray-500">{s.stationNumber}</span>
                                </div>
                                <div className="text-sm text-gray-600 mb-3">Average annual rainfall</div>
                                <div className="text-3xl font-extrabold text-gray-900 mb-4">{s.avgAnnual.toLocaleString()} mm</div>
                                <div className="text-sm text-gray-700">
                                    Wettest month: <span className="font-semibold">{s.wettest.month}</span>
                                    {" "}
                                    (<span className="font-semibold">{s.wettest.value.toFixed(1)} mm</span> avg)
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </section>
    );
};
