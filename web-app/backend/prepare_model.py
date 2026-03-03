"""
Prepare Model for Web App
=========================
Run this ONCE before starting the backend server.

Computes and saves StandardScaler normalization parameters from the training data
so the backend can replicate the exact same preprocessing used during training.

Usage:
    cd web-app/backend
    python prepare_model.py
"""

import json
import numpy as np
from pathlib import Path
from sklearn.preprocessing import StandardScaler


# ─────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────

POSSIBLE_DATA_PATHS = [
    Path("../../pureX.npy"),
    Path("../../../pureX.npy"),
    Path("pureX.npy"),
]

OUTPUT_PATH = Path("normalization_params.json")


def find_data_file() -> Path | None:
    """Search common locations for pureX.npy and return the first match, or None."""
    for path in POSSIBLE_DATA_PATHS:
        if path.exists():
            return path.resolve()
    return None


def main() -> None:
    """Compute and save StandardScaler normalization parameters."""
    print("Looking for pixel data (pureX.npy)...")
    data_path = find_data_file()

    if data_path is None:
        print(
            "\npureX.npy not found — this is OK.\n"
            "The backend will use /255 normalization as a fallback.\n"
            "\nTo enable exact training-time normalization (better accuracy):\n"
            "  1. Run data_prep.py from the emotion-detection-cnn root to regenerate pureX.npy\n"
            "  2. Re-run this script\n"
            "\nYou can start the backend server now without this step."
        )
        return

    print(f"Found: {data_path}")

    print("Loading pixel data...")
    X = np.load(str(data_path))
    print(f"Loaded {len(X):,} samples with {X.shape[1]} features each")

    print("Fitting StandardScaler...")
    scaler = StandardScaler()
    scaler.fit(X)

    params = {
        "mean": scaler.mean_.tolist(),
        "std": scaler.scale_.tolist(),
        "n_samples": int(len(X)),
        "n_features": int(X.shape[1]),
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(params, f)

    print(f"\nSaved normalization parameters to: {OUTPUT_PATH.resolve()}")
    print("Setup complete. You can now start the backend server.")


if __name__ == "__main__":
    main()
