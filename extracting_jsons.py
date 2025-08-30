import sys
import json

def start():
    file_list = [
        "Abbotsford_risk.json",
        "Centennial_Park_risk.json",
        "Chatswood_risk.json",
        "Marrickville_risk.json",
        "Millers_Point_risk.json",
        "Randwick_Racecourse_NSW_risk.json",
        "Randwick_risk.json",
        "Rose_Bay_risk.json",
        "Sydney_Olympic_Park_risk.json"
    ]

    with open(f"weather data/station_coordinates.json", "r") as f:
        station_info = json.load(f)

    for file_name in file_list:
        with open(f"weather data/out/{file_name}", "r") as f:
            json_data = json.load(f)

        cum_risk = 0

        for item in json_data[-4:]:
            cum_risk += item["risk_class"]

        station_info[file_name[:-10]]["mean_risk"] = round(cum_risk / 4, 5)

    return station_info

    # for thing in station_info:
    #     print(thing)
    #     print(station_info[thing])
    #     print()
    #
    # sys.exit()
