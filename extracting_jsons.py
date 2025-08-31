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
        "Sydney_Olympic_Park_risk.json",
        "Avoca_Beach_risk.json",
        "Concord_risk.json",
        "Cronulla_risk.json",
        "Mascot_risk.json",
        "Sans_Souci_risk.json",
        "Terrey_Hills_risk.json",
        "Lucas_Heights_risk.json",
        "Mount_Kuring-Gai_risk.json",
        "Gordon_risk.json",
        "Collaroy_risk.json",
        "Mona_Vale_risk.json",
        "Duffys_Forest_risk.json",
        "Peakhurst_risk.json",
        "Macquarie_Park_risk.json",
        "Holsworthy_risk.json",
        "Audley_risk.json",
        "Canterbury_risk.json",
        "Wahroonga_risk.json",
        "Hornsby_risk.json",
        "North_Parramatta_risk.json",
        "North_Rocks_risk.json"
    ]

    with open(f"public/data/station_coordinates.json", "r") as f:
        station_info = json.load(f)

    for file_name in file_list:
        with open(f"public/data/out/{file_name}", "r") as f:
            json_data = json.load(f)

        cum_risk = 0

        for item in json_data[-4:]:
            cum_risk += item["risk_class"]

        station_info[file_name[:-10]]["mean_risk"] = round(cum_risk / 4, 5)

    return station_info
