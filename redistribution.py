import json
import math
import numpy as np
from scipy.signal import convolve2d
from scipy.spatial import cKDTree
from scipy import ndimage
import matplotlib.pyplot as plt
from scipy.interpolate import griddata
from scipy.ndimage import gaussian_filter, uniform_filter, maximum_filter, distance_transform_edt, label, convolve
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

    print(f"{int((min_value * 300)) = }, {int((max_value * 300)) = }")
    return min_value, max_value

def get_coord_range(json_data):
    min_lat, max_lat = get_min_max_coordinate(json_data, 'latitude')
    min_lon, max_lon = get_min_max_coordinate(json_data, 'longitude')

    lat_range = int((max_lat * 300) - (min_lat * 300))
    lon_range = int((max_lon * 300) - (min_lon * 300))

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

    for i in range(100):
        matrix = estimate_unknown_regions(matrix)

    for i in range(100):
        matrix = estimate_unknown_regions2(matrix)

    matrix = rescale_to_range(matrix)

    print_matrix(matrix)
    return matrix


def coord_to_index(coord, min_coord, buffer):
    coord = int(abs(coord) * 300)
    min_coord = int(abs(min_coord) * 300)

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


# def estimate_unknown_regions(arr, gradient_threshold=0.1):
#     """
#     Gradient-based smoothing - considers rate of change
#     """
#     # Calculate gradients
#     grad_x = np.gradient(arr.astype(np.float64), axis=1)
#     grad_y = np.gradient(arr.astype(np.float64), axis=0)
#     gradient_magnitude = np.sqrt(grad_x ** 2 + grad_y ** 2)
#
#     # Adaptive smoothing based on gradient
#     max_neighbors = maximum_filter(arr, size=3, mode='constant', cval=0)
#     avg_neighbors = uniform_filter(arr.astype(np.float64), size=3, mode='constant', cval=0)
#
#     # Smooth more where gradients are high
#     smooth_factor = np.clip(gradient_magnitude / (gradient_magnitude.max() + 1e-8),
#                             gradient_threshold, 1.0)
#
#     result = arr.copy().astype(np.float64)
#     mask = arr < max_neighbors
#     result[mask] = (1 - smooth_factor[mask]) * arr[mask] + smooth_factor[mask] * avg_neighbors[mask]
#
#     return result


def estimate_unknown_regions(arr, diffusion_rate=0.5, power=2, offset=0.3):
    """
    Inverse power law decay: weight = 1 / (distance + offset)^power
    Steep drop initially, long gentle tail
    """
    max_neighbors = maximum_filter(arr, size=3, mode='constant', cval=0)

    # Distance-based weights with inverse power law
    distances = np.array([
        [np.sqrt(2), 1, np.sqrt(2)],
        [1, 0, 1],
        [np.sqrt(2), 1, np.sqrt(2)]
    ])

    # Inverse power law decay
    weights = 1.0 / ((distances + offset) ** power)
    weights[1, 1] = 1.0  # Center gets full weight

    mid, k = 1.5, 5
    weights = 1.0 / (1.0 + np.exp(k * (distances - mid)))
    weighted_avg = convolve(arr.astype(np.float64), weights, mode='constant', cval=0)

    result = arr.copy().astype(np.float64)
    mask = arr < max_neighbors
    result[mask] = (1 - diffusion_rate) * arr[mask] + diffusion_rate * weighted_avg[mask]

    return result


def estimate_unknown_regions2(arr, diffusion_rate=0.5, power=2, offset=0.3):
    """
    Inverse power law decay: weight = 1 / (distance + offset)^power
    Steep drop initially, long gentle tail
    """
    max_neighbors = maximum_filter(arr, size=3, mode='constant', cval=0)

    # Distance-based weights with inverse power law
    distances = np.array([
        [np.sqrt(2), 1, np.sqrt(2)],
        [1, 0, 1],
        [np.sqrt(2), 1, np.sqrt(2)]
    ])

    # Inverse power law decay
    weights = 1.0 / ((distances + offset) ** power)
    weights[1, 1] = 1.0  # Center gets full weight

    weighted_sum = convolve(arr, weights, mode='constant', cval=0)
    normalizer = convolve((arr > 0).astype(float), weights, mode='constant', cval=0)
    weighted_avg = np.divide(weighted_sum, normalizer,
                             out=np.zeros_like(weighted_sum),
                             where=normalizer > 0)

    result = arr.copy().astype(np.float64)
    mask = arr < max_neighbors
    result[mask] = (1 - diffusion_rate) * arr[mask] + diffusion_rate * weighted_avg[mask]

    return result


def rescale_to_range(arr, target_min=1.0, target_max=5.0):
    """
    Rescale array values to target range, preserving zeros
    """
    # Only rescale non-zero values
    mask = arr > 0
    if not np.any(mask):
        return arr.copy()

    values = arr[mask]
    current_min, current_max = values.min(), values.max()

    if current_max <= current_min:
        # All non-zero values are the same
        result = arr.copy()
        result[mask] = target_min
        return result

    # Scale non-zero values to target range
    result = arr.copy()
    scaled_values = target_min + (values - current_min) * (target_max - target_min) / (current_max - current_min)
    result[mask] = scaled_values

    return result

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
# #
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


# def estimate_unknown_regions(matrix):
#     """
#     Optimized version that only processes non-zero regions + padding
#     """
#     if np.all(matrix == 0):
#         return matrix.copy().astype(np.float64)
#
#     # Find bounding box of non-zero elements with 1-cell padding
#     rows, cols = np.nonzero(matrix)
#     if len(rows) == 0:
#         return matrix.copy().astype(np.float64)
#
#     min_row, max_row = max(0, rows.min() - 1), min(matrix.shape[0], rows.max() + 2)
#     min_col, max_col = max(0, cols.min() - 1), min(matrix.shape[1], cols.max() + 2)
#
#     # Extract sub-array
#     sub_arr = matrix[min_row:max_row, min_col:max_col]
#
#     # Process only the sub-array
#     max_neighbors = maximum_filter(sub_arr, size=3, mode='constant', cval=0)
#     avg_neighbors = uniform_filter(sub_arr.astype(np.float64), size=3, mode='constant', cval=0)
#     mask = sub_arr < max_neighbors
#
#     # Create result and update sub-region
#     result = matrix.copy().astype(np.float64)
#     sub_result = sub_arr.copy().astype(np.float64)
#     sub_result[mask] = avg_neighbors[mask]
#     result[min_row:max_row, min_col:max_col] = sub_result
#
#     return result

# def estimate_unknown_regions(matrix, size=3):
#     matrix = matrix.astype(np.float64)
#
#     # Kernel of ones to compute local sum
#     kernel = np.ones((size, size), dtype=np.float64)
#
#     # Compute local sum
#     local_sum = convolve(matrix, kernel, mode="nearest")
#
#     # Scale by 0.8
#     adjusted_value = 0.8 * local_sum
#
#     # Prevent runaway growth (clip values)
#     adjusted_value = np.clip(adjusted_value, 0, np.max(matrix))
#
#     # Compute local maximum
#     local_max = maximum_filter(matrix, size=size, mode="nearest")
#
#     # Keep original if it's the local max, otherwise use adjusted sum
#     result = np.where(matrix == local_max, matrix, adjusted_value)
#
#     return result


# def estimate_unknown_regions(matrix, decay=0.999):
#     mask = matrix > 0
#
#     # For each zero, get distance & nearest seed indices
#     dist, (inds_x, inds_y) = distance_transform_edt(~mask, return_indices=True)
#
#     # Assign nearest seed value, decayed by distance
#     result = matrix[inds_x, inds_y] * (decay ** dist)
#
#     return result


def local_sum(matrix, size=3):
    matrix = matrix.astype(np.float64)

    # Make a kernel of ones (size x size)
    kernel = np.ones((size, size), dtype=np.float64)

    # Convolve (sum of neighbors within the window)
    summed = convolve(matrix, kernel, mode="nearest")
    return summed

def print_matrix(matrix):
    subset = matrix[:100, :100]
    np.set_printoptions(threshold=10000, precision=2, suppress=True)
    print(subset)

def place_station_labels(json_data, matrix, left_buffer, top_buffer, ax=None):
    """
    Place station name labels on the rotated heatmap (vertical flip + 90° anticlockwise),
    with lines pointing exactly to their markers, labels offset, and manual point shifts.
    """
    if ax is None:
        ax = plt.gca()

    max_lat = get_min_max_coordinate(json_data, 'latitude')[1]
    min_lon = get_min_max_coordinate(json_data, 'longitude')[0]

    rows, cols = matrix.shape

    # Collect all station positions
    stations = []
    for name in json_data:
        i = coord_to_index(json_data[name]['latitude'], max_lat, top_buffer)
        j = coord_to_index(json_data[name]['longitude'], min_lon, left_buffer)

        # Flip vertically
        i_flipped = rows - 1 - i
        # Rotate 90° anticlockwise
        new_i, new_j = j, i_flipped

        # Apply manual shifts
        new_i += 50   # shift x
        new_j -= 150  # shift y

        stations.append((name, new_i, new_j))

    # Sort stations by new_j for label arrangement
    stations.sort(key=lambda x: x[2])

    # Define horizontal and vertical offset for labels
    x_offset = cols * 0.05
    y_offset = rows * 0.02

    if len(stations) > 0:
        if len(stations) == 1:
            label_positions = [rows / 2]
        else:
            label_positions = np.linspace(rows * 0.1, rows * 0.9, len(stations))

        labels = [
            "Holsworthy",
            "Canterbury",
            "Darrys_Forest",
            "Mascot",
            "Hornsby",
            "Cronulla",
            "Gordon",
            "Lucas_Heights",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ]

        for idx, (name, i, j) in enumerate(stations):
            if name not in labels:
                continue

            # Offset the label position from the marker
            label_x = i + x_offset
            label_y = j + y_offset

            # Draw line from marker to label
            ax.plot([i, label_x], [j, label_y], 'k-', linewidth=1.5, alpha=0.8)

            # Place the label at the offset position
            ax.text(label_x, label_y, name,
                    fontsize=10,
                    ha='left',
                    va='center',
                    rotation=0,
                    bbox=dict(boxstyle='round,pad=0.4',
                              facecolor='white',
                              alpha=0.9,
                              edgecolor='black',
                              linewidth=1),
                    color='black',
                    weight='bold')

            # Draw the marker at the shifted station position
            ax.plot(i, j, 'ko', markersize=6, markerfacecolor='red',
                    markeredgecolor='black', markeredgewidth=2)


def plot_heatmap(matrix, json_data, left_buffer, top_buffer, title="Heatmap with Station Labels", save_path="heatmap.png"):
    """
    Plot heatmap with station labels overlaid,
    vertically flipped and rotated 90° anticlockwise.
    Optionally save the figure as an image file.

    Args:
        matrix: 2D numpy array of values
        json_data: Dictionary with station data
        left_buffer: Left buffer for coordinate conversion
        top_buffer: Top buffer for coordinate conversion
        title: Plot title
        save_path: If provided, saves the figure to this path (e.g., 'heatmap.png')
    """
    import matplotlib.pyplot as plt
    import numpy as np

    # Ensure matrix is numeric
    numeric_matrix = np.array(matrix, dtype=np.float64)

    # --- Flip vertically ---
    numeric_matrix = np.flipud(numeric_matrix)

    # --- Rotate 90° anticlockwise ---
    numeric_matrix = np.rot90(numeric_matrix, k=1)

    rows, cols = numeric_matrix.shape

    # Make figure height proportional to number of rows, width proportional to number of cols
    aspect_ratio = rows / cols
    plt.figure(figsize=(8, 8 * aspect_ratio))

    # Create the heatmap
    im = plt.imshow(
        numeric_matrix,
        interpolation='nearest',
        origin='lower',
        aspect='auto'
    )
    plt.colorbar(im, label='Value')

    # Add station labels
    place_station_labels(json_data, numeric_matrix, left_buffer, top_buffer)

    plt.title(title)
    plt.xlabel("Column index")
    plt.ylabel("Row index")

    # Save image if path is provided
    if save_path is not None:
        plt.savefig(save_path, bbox_inches='tight', dpi=300)

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

    plot_heatmap(matrix, json_data, left_buffer, top_buffer)



    # matrix_lat_range, matrix_lon_range = get_list_range(json_data)
    #
    # matrix = create_matrix(json_data, matrix_lat_range, matrix_lon_range)



if __name__ == "__main__":
    main()
