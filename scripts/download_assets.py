"""
Download the datasets and model checkpoints that are intentionally not
tracked in git (see .gitignore). Run from the repo root:

    python scripts/download_assets.py            # .npy arrays + dlib .dat
    python scripts/download_assets.py --models   # also fetch .h5 checkpoints

FER2013 train/test image folders (used by sample_images/ and optional
experiments) are available from Kaggle:
    kaggle datasets download -d msambare/fer2013
"""

import argparse
import subprocess
import sys
from pathlib import Path

_GCS = (
    "https://storage.googleapis.com/inspirit-ai-data-bucket-1/Data/AI%20Scholars/"
    "Sessions%206%20-%2010%20(Projects)/Project%20-%20Emotion%20Detection/"
)

DATA_ASSETS = {
    "pureX.npy": _GCS + "pureX.npy",
    "dataX.npy": _GCS + "dataX_edited.npy",
    "dataY.npy": _GCS + "dataY.npy",
    "shape_predictor_68_face_landmarks.dat": _GCS + "shape_predictor_68_face_landmarks.dat",
}

_RELEASE = "https://github.com/Pratyushpad27/fer2013-emotion-detection/releases/download/v1.0-models/"

MODEL_ASSETS = {
    "best_mlp_model.h5": _RELEASE + "best_mlp_model.h5",
    "best_lm_model.h5": _RELEASE + "best_lm_model.h5",
    "best_cnn_model.h5": _RELEASE + "best_cnn_model.h5",
    "best_vgg_model.h5": _RELEASE + "best_vgg_model.h5",
}


def download(assets: dict[str, str]) -> bool:
    ok = True
    for filename, url in assets.items():
        dest = Path(filename)
        if dest.exists():
            print(f"✓ {filename} already exists — skipping")
            continue
        print(f"↓ {filename}")
        result = subprocess.run(["curl", "-fL", "--retry", "3", "-o", str(dest), url])
        if result.returncode != 0:
            print(f"✗ failed to download {filename} from {url}", file=sys.stderr)
            dest.unlink(missing_ok=True)
            ok = False
    return ok


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--models", action="store_true", help="also download .h5 checkpoints")
    args = parser.parse_args()

    assets = dict(DATA_ASSETS)
    if args.models:
        assets.update(MODEL_ASSETS)

    sys.exit(0 if download(assets) else 1)
