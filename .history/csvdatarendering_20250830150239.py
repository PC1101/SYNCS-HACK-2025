#!/usr/bin/env python3
# nsw_drought_allocation.py
# Self-contained demo: drought risk scoring + water allocation (LP with fallback)

from math import radians, sin, cos, asin, sqrt
import random
import sys

# ---------------------------
# Mock geodata (centroids) for a few NSW regions + mock supplies
# ---------------------------
REGIONS = [
    # name,  lat,    lon
    ("Sydney (C)",        -33.8688, 151.2093),
    ("Newcastle",         -32.9283, 151.7817),
    ("Wollongong",        -34.4278, 150.8931),
    ("Dubbo",             -32.2569, 148.6010),
    ("Wagga Wagga",       -35.1080, 147.3598),
    ("Tamworth",          -31.0905, 150.9291),
    ("Armidale",          -30.5123, 151.6655),
    ("Broken Hill",       -31.9530, 141.4530),
    ("Coffs Harbour",     -30.2963, 153.1157),
    ("Albury",            -36.0800, 146.9150),
]

SUPPLIES = [
    # name,         lat,      lon,      supply_units
    ("Prospect WTP", -33.8030, 150.9020, 180.0),
    ("Grahamstown",  -32.8040, 151.7000, 120.0),
    ("Bendeela",     -34.6880, 150.4040, 100.0),
]

# Total supply implied by the supplies above = 400 units in this mock.


# ---------------------------
# Utilities
# ---------------------------
def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance (km)."""
    R = 6371.0
    la1, lo1, la2, lo2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = la2 - la1, lo2 - lo1
    a = sin(dlat/2)**2 + cos(la1)*cos(la2)*sin(dlon/2)**2
    return 2 * R * asin(sqrt(a))

def clip(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))

def normalize(x, xmin, xmax):
    if xmax == xmin:
        return 0.0
    return clip((x - xmin) / (xmax - xmin), 0.0, 1.0)

def rank_from_score(score_0_100):
    s = int(round(score_0_100))
    if   0 <= s <= 20:  return 1
    if  21 <= s <= 40:  return 2
    if  41 <= s <= 60:  return 3
    if  61 <= s <= 80:  return 4
    return 5


# ---------------------------
# Mock feature generation
# ---------------------------
def make_mock_features(seed=42):
    """
    For each region, create:
      - rain_past_7 (mm), rain_forecast_3 (mm), temp_anom (°C >= -2..+6),
      - soil_moist (0..1), pop_weight (0..1), agri_weight (0..1)
    Values are plausible-ish and varied for testing.
    """
    random.seed(seed)
    feats = {}
    for name, lat, lon in REGIONS:
        rain_past_7   = max(0, random.gauss(20, 15))     # mm last 7d
        rain_fore_3   = max(0, random.gauss(8, 8))       # mm next 3d
        temp_anom     = random.uniform(-2.0, 6.0)        # °C vs seasonal
        soil_moist    = clip(random.uniform(0.1, 0.9))   # 0(dry) .. 1(wet)
        pop_weight    = clip(random.uniform(0.1, 1.0))   # importance via people
        agri_weight   = clip(random.uniform(0.1, 1.0))   # importance via ag
        feats[name] = dict(
            rain_past_7=rain_past_7,
            rain_forecast_3=rain_fore_3,
            temp_anom=temp_anom,
            soil_moist=soil_moist,
            pop_weight=pop_weight,
            agri_weight=agri_weight,
            lat=lat, lon=lon
        )
    return feats


# ---------------------------
# Risk scoring (0–100) and rank (1–5)
# ---------------------------
def compute_risks(features):
    """
    Implements the scoring described earlier:
      rain_deficit, heat_stress, dryness, exposure -> weighted normalized sum.
    Returns dict: name -> {score_0_100, rank, drivers...}
    """
    # Compute raw drivers
    raw = {}
    for name, f in features.items():
        rain_deficit = max(0.0, f["rain_past_7"] - f["rain_forecast_3"])
        heat_stress  = max(0.0, f["temp_anom"])
        dryness      = 1.0 - f["soil_moist"]
        exposure     = 0.5 * f["pop_weight"] + 0.5 * f["agri_weight"]
        raw[name] = dict(rain_deficit=rain_deficit, heat_stress=heat_stress,
                         dryness=dryness, exposure=exposure)

    # Min/max for normalization
    def mm(key):
        vals = [raw[n][key] for n in raw]
        return (min(vals), max(vals))

    min_def, max_def = mm("rain_deficit")
    min_heat, max_heat = mm("heat_stress")
    min_dry, max_dry = mm("dryness")

    # Weights: adjust as needed (sum ~ 1)
    w = {"rain": 0.45, "heat": 0.20, "dry": 0.15, "exp": 0.20}

    results = {}
    for name, drv in raw.items():
        D_rain = normalize(drv["rain_deficit"], min_def, max_def)
        D_heat = normalize(drv["heat_stress"],  min_heat, max_heat)
        D_dry  = normalize(drv["dryness"],      min_dry,  max_dry)
        D_exp  = clip(drv["exposure"])  # already 0..1

        risk_0_1 = (w["rain"] * D_rain +
                    w["heat"] * D_heat +
                    w["dry"]  * D_dry  +
                    w["exp"]  * D_exp)
        score = round(100 * risk_0_1)
        rank  = rank_from_score(score)

        results[name] = dict(
            score_0_100=score, rank=rank,
            D_rain=D_rain, D_heat=D_heat, D_dry=D_dry, D_exp=D_exp,
            rain_deficit=drv["rain_deficit"],
            heat_stress=drv["heat_stress"],
            dryness=drv["dryness"],
            exposure=drv["exposure"]
        )
    return results


# ---------------------------
# Need shaping and cost matrix
# ---------------------------
def build_needs(features, risks, total_supply):
    """
    Convert risk -> need with exposure weighting, then scale so sum need ~= total_supply.
    """
    eps = 1e-3
    prelim = {}
    for name, r in risks.items():
        f = features[name]
        risk_0_1 = r["score_0_100"] / 100.0
        exposure = 0.5 * f["pop_weight"] + 0.5 * f["agri_weight"]
        prelim[name] = max(0.0, risk_0_1 * (eps + exposure))

    prelim_sum = sum(prelim.values()) or 1.0
    scale = total_supply / prelim_sum
    need = {name: v * scale for name, v in prelim.items()}
    return need

def build_costs(features, supplies, cost_per_km=1.0):
    """
    Cost matrix: supply -> region based on haversine distance (km) * unit cost.
    """
    cost = {}
    for sname, slat, slon, _supply in supplies:
        cost[sname] = {}
        for rname, r in features.items():
            d = haversine_km(slat, slon, r["lat"], r["lon"])
            cost[sname][rname] = d * cost_per_km
    return cost


# ---------------------------
# Allocation methods
# ---------------------------
def allocation_proportional(need, total_supply):
    """Proportional allocation across regions (baseline)."""
    total_need = sum(need.values()) or 1.0
    served = {r: total_supply * (need[r] / total_need) for r in need}
    return served, None  # None = no per-supply breakdown

def allocation_transport_lp(need, supplies, cost):
    """
    Min-cost transportation using PuLP if available.
    Returns: served_by_region, allocation_by_supply (dict of dict)
    Falls back by raising ImportError if pulp missing.
    """
    try:
        import pulp
    except Exception as e:
        raise ImportError("PuLP not available") from e

    # Sets
    S = [s[0] for s in supplies]
    R = list(need.keys())

    # Supply capacities
    supply_cap = {s[0]: float(s[3]) for s in supplies}
    total_supply = sum(supply_cap.values())
    total_need = sum(need.values())

    # If total_need > total_supply, scale needs down (soft demand)
    scale = 1.0
    if total_need > total_supply and total_need > 0:
        scale = total_supply / total_need
    scaled_need = {r: need[r] * scale for r in R}

    # LP
    prob = pulp.LpProblem("MinCostTransport", pulp.LpMinimize)
    x = {(s, r): pulp.LpVariable(f"x_{s}_{r}", lowBound=0) for s in S for r in R}

    # Objective
    prob += pulp.lpSum(cost[s][r] * x[(s, r)] for s in S for r in R)

    # Supply constraints
    for s in S:
        prob += pulp.lpSum(x[(s, r)] for r in R) <= supply_cap[s]

    # Demand (serve at least scaled_need; since sum scaled_need <= supply, equality emerges)
    for r in R:
        prob += pulp.lpSum(x[(s, r)] for s in S) >= scaled_need[r]

    # Solve
    prob.solve(pulp.PULP_CBC_CMD(msg=False))
    status = pulp.LpStatus[prob.status]
    if status not in ("Optimal", "Feasible"):
        raise RuntimeError(f"LP not solved: {status}")

    # Extract
    alloc_supply = {s: {} for s in S}
    served = {r: 0.0 for r in R}
    for s in S:
        for r in R:
            val = x[(s, r)].value() or 0.0
            if val > 1e-9:
                alloc_supply[s][r] = val
                served[r] += val

    return served, alloc_supply


# ---------------------------
# Pretty printing
# ---------------------------
def print_risk_table(features, risks):
    rows = []
    for name in risks:
        r = risks[name]
        f = features[name]
        rows.append((
            name, r["score_0_100"], r["rank"],
            round(f["rain_past_7"],1), round(f["rain_forecast_3"],1),
            round(f["temp_anom"],1), round(f["soil_moist"],2),
            round(f["pop_weight"],2), round(f["agri_weight"],2)
        ))
    rows.sort(key=lambda x: (-x[1], x[0]))
    print("\n=== Drought Risk by Region ===")
    print("Region                         Score  Rank  rain7  fore3  dT(°C)  soil  pop  agri")
    for row in rows:
        print(f"{row[0]:30s} {row[1]:5d}  {row[2]:4d}  {row[3]:5.1f}  {row[4]:5.1f}  {row[5]:6.1f}  {row[6]:4.2f}  {row[7]:4.2f}  {row[8]:4.2f}")

def print_allocation(served_by_region, alloc_by_supply=None):
    print("\n=== Allocation by Region (units) ===")
    for r, amt in sorted(served_by_region.items(), key=lambda kv: -kv[1]):
        print(f"{r:30s} {amt:8.2f}")

    if alloc_by_supply:
        print("\n=== Breakdown by Supply Site → Region (units) ===")
        for s, m in alloc_by_supply.items():
            print(f"- {s}")
            for r, amt in sorted(m.items(), key=lambda kv: -kv[1]):
                print(f"    -> {r:25s} {amt:8.2f}")


# ---------------------------
# Main demo
# ---------------------------
def main():
    features = make_mock_features(seed=2025)
    risks = compute_risks(features)
    print_risk_table(features, risks)

    total_supply = sum(s[3] for s in SUPPLIES)
    need = build_needs(features, risks, total_supply)
    cost = build_costs(features, SUPPLIES, cost_per_km=1.0)

    # Try LP; fallback to proportional if PuLP missing or LP error
    try:
        served, alloc = allocation_transport_lp(need, SUPPLIES, cost)
        print("\nUsing transportation LP (min-cost).")
    except Exception as e:
        print(f"\n[Info] LP unavailable or failed ({e}). Falling back to proportional allocation.")
        served, alloc = allocation_proportional(need, total_supply)

    print_allocation(served, alloc)

    # Quick AI-style summary
    high_risk = sorted(((n, r["score_0_100"], r["rank"]) for n, r in risks.items()),
                       key=lambda x: -x[1])[:3]
    focus_str = ", ".join([f"{n} (score {s}, rank {rk})" for n, s, rk in high_risk])
    print("\n=== AI Summary ===")
    print(f"Top risk regions: {focus_str}. Allocation prioritizes these while minimizing transport cost from available supplies.")

if __name__ == "__main__":
    main()
