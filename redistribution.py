import json
import math
import numpy as np
from scipy.signal import convolve2d
from scipy.spatial import cKDTree
from scipy import ndimage
import matplotlib.pyplot as plt
from scipy.interpolate import griddata
from scipy.ndimage import gaussian_filter, uniform_filter, maximum_filter

def unpack_json():
    with open("sample_data.json", "r") as f:
        data = json.load(f)
    return data

def get_min_max_coordinate(json_data, variable):
    max_value = 0
    min_value = 10000

    first = True

    for item in json_data:
        if first:
            max_value = item[variable]
            min_value = item[variable]
            first = False
            continue

        max_value = max(max_value, item[variable])
        min_value = min(min_value, item[variable])

    print(f"{int((min_value * 1000)) = }, {int((max_value * 1000)) = }")
    return min_value, max_value

def get_coord_range(json_data):
    min_lat, max_lat = get_min_max_coordinate(json_data, 'latitude')
    min_lon, max_lon = get_min_max_coordinate(json_data, 'longitude')

    lat_range = int((max_lat * 1000) - (min_lat * 1000))
    lon_range = int((max_lon * 1000) - (min_lon * 1000))

    # 3016, 5949
    return lat_range, lon_range

def get_list_range(lat_range, lon_range):
    return int(math.ceil(lat_range / 10) * 10), int(math.ceil(lon_range / 10) * 10)

def get_buffer(coord_lat, coord_lon, list_lat, list_lon):
    return int(math.floor((list_lat - coord_lat) / 2)), int(math.floor((list_lon - coord_lon) / 2))

def create_matrix(json_data, N, M, left_buffer, top_buffer):
    matrix = np.zeros((N, M), dtype=np.float64)
    matrix = place_existing_info(json_data, matrix, left_buffer, top_buffer)

    for i in range(1):
        matrix = estimate_unknown_regions(matrix)

    print_matrix(matrix)
    return matrix


def coord_to_index(coord, min_coord, buffer):
    coord = int(abs(coord) * 1000)
    min_coord = int(abs(min_coord) * 1000)

    return coord - min_coord + buffer

def place_existing_info(json_data, matrix, left_buffer, top_buffer):
    max_lat = get_min_max_coordinate(json_data, 'latitude')[1]
    min_lon = get_min_max_coordinate(json_data, 'longitude')[0]

    for item in json_data:
        i = coord_to_index(item['latitude'], max_lat, top_buffer)
        j = coord_to_index(item['longitude'], min_lon, left_buffer)
        rainfall = item['cumulative_rainfall']

        matrix[j, i] = rainfall

    return matrix

def estimate_unknown_regions(matrix, size=3):
    # Compute local mean
    local_mean = uniform_filter(matrix.astype(float), size=size, mode="nearest")

    # Compute local maximum
    local_max = maximum_filter(matrix, size=size, mode="nearest")

    # If cell == local max → keep original
    result = np.where(matrix == local_max, matrix, local_mean)

    return result

def print_matrix(matrix):
    subset = matrix[:100, :100]
    np.set_printoptions(threshold=10000, precision=2, suppress=True)
    print(subset)

def plot_heatmap(matrix, title="Heatmap"):
    # Ensure matrix is numeric
    numeric_matrix = np.array(matrix, dtype=np.float64)
    rows, cols = numeric_matrix.shape

    # Make figure height proportional to number of rows,
    # and width proportional to number of cols
    aspect_ratio = rows / cols
    plt.figure(figsize=(8, 8 * aspect_ratio))

    im = plt.imshow(
        numeric_matrix,
        cmap='hot',
        interpolation='nearest',
        origin='lower',
        aspect='auto'  # allow axis scaling based on figsize
    )
    plt.colorbar(im, label='Value')
    plt.title(title)
    plt.xlabel("Column index")
    plt.ylabel("Row index")
    plt.show()


def main():
    json_data = unpack_json()

    coord_lat_range, coord_lon_range = get_coord_range(json_data)
    list_lat_size, list_lon_size = get_list_range(coord_lat_range, coord_lon_range)
    left_buffer, top_buffer = get_buffer(coord_lat_range, coord_lon_range, list_lat_size, list_lon_size)

    print(f"{coord_lat_range = }, {coord_lon_range = }")
    print(f"{list_lat_size = }, {list_lon_size = }")
    print(f"{left_buffer = }, {top_buffer = }")

    matrix = create_matrix(json_data, list_lon_size, list_lat_size, left_buffer, top_buffer)

    plot_heatmap(matrix)



    # matrix_lat_range, matrix_lon_range = get_list_range(json_data)
    #
    # matrix = create_matrix(json_data, matrix_lat_range, matrix_lon_range)



if __name__ == "__main__":
    main()
