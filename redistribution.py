import json
import math
import numpy as np
from scipy.signal import convolve2d
from scipy.spatial import cKDTree
from scipy import ndimage
import matplotlib.pyplot as plt
from scipy.interpolate import griddata
from scipy.ndimage import gaussian_filter, uniform_filter, maximum_filter, distance_transform_edt, label
from scipy.spatial.distance import cdist

from extracting_jsons import start

def unpack_json():
    return start()
    # with open("sample_data.json", "r") as f:
    #     data = json.load(f)
    # return data

def get_min_max_coordinate(json_data, variable):
    max_value = 0
    min_value = 10000

    first = True

    for name in json_data:
        if first:
            max_value = json_data[name][variable]
            min_value = json_data[name][variable]
            first = False
            continue

        max_value = max(max_value, json_data[name][variable])
        min_value = min(min_value, json_data[name][variable])

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
    top_buffer = max(2, int(math.floor((list_lat - coord_lat) / 2)))
    left_buffer = max(2, int(math.floor((list_lon - coord_lon) / 2)))
    return top_buffer, left_buffer

def create_matrix(json_data, N, M, left_buffer, top_buffer):
    matrix = np.zeros((N, M), dtype=np.float64)
    matrix = place_existing_info(json_data, matrix, left_buffer, top_buffer)

    for i in range(5000):
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

    for name in json_data:
        i = coord_to_index(json_data[name]['latitude'], max_lat, top_buffer)
        j = coord_to_index(json_data[name]['longitude'], min_lon, left_buffer)
        mean_risk = json_data[name]['mean_risk']

        try:
            matrix[j, i] = mean_risk
        except IndexError:
            continue

    return matrix

# def estimate_unknown_regions(matrix, size=3, sigma=2.0):
#     # Compute local maxima
#     local_max = maximum_filter(matrix, size=size, mode="nearest")
#     peak_mask = (matrix == local_max) & (matrix > 0)
#
#     # Label each peak (so we can scale decay by its own height)
#     labeled, num_features = label(peak_mask)
#
#     # Initialize result
#     result = np.zeros_like(matrix, dtype=float)
#
#     for peak_id in range(1, num_features + 1):
#         # mask for this peak
#         this_peak = (labeled == peak_id)
#
#         # peak height
#         peak_height = matrix[this_peak].max()
#
#         # distances to this peak
#         dists = distance_transform_edt(~this_peak)
#
#         # exponential decay from this peak’s height
#         decay_surface = peak_height * np.exp(-(dists**2) / (2 * sigma**2))
#
#         # take max across overlapping peaks
#         result = np.maximum(result, decay_surface)
#
#     return result

# def radial_decay(matrix, peaks, sigma=2.0):
#     h, w = matrix.shape
#     coords = np.indices((h, w)).reshape(2, -1).T  # all pixel coords
#
#     # distances to nearest peak
#     dists = cdist(coords, peaks).min(axis=1).reshape(h, w)
#
#     # exponential decay
#     decay_surface = np.exp(-(dists**2) / (2 * sigma**2))
#
#     # scale by max value
#     return matrix.max() * decay_surface
#
#
# def estimate_unknown_regions(matrix, size=3, sigma=2.0):
#     # Compute local maximums
#     local_max = maximum_filter(matrix, size=size, mode="nearest")
#
#     # Find coordinates of peak cells (where matrix == local max & matrix > 0)
#     peak_coords = np.argwhere(matrix == local_max)
#
#     # Build smooth radial decay surface from peaks
#     decay_surface = radial_decay(matrix, peak_coords, sigma=sigma)
#
#     # Keep peaks as original, everything else uses decay surface
#     result = np.where(matrix == local_max, matrix, decay_surface)
#
#     return result

def estimate_unknown_regions(matrix, size=3):
    # Compute local mean
    local_mean = uniform_filter(matrix.astype(float), size=size, mode="nearest")
    # local_mean = gaussian_filter(matrix.astype(float), sigma=2)

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
