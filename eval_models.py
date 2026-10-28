"""
Evaluate the four saved checkpoints on the held-out validation split.

Reuses load_data/preprocess_data/reshape_for_cnn from model.py so the split
(train_test_split, test_size=0.1, random_state=42) and StandardScaler
normalization match training exactly.

Two tables are printed:
  1. All 2,000 validation rows (the original, leaky numbers).
  2. De-duplicated validation: rows whose pixels nearly match a training row
     (RMSE < 3.5 gray levels over the 48x48 image) are dropped. About 10% of
     the validation rows are near-copies of training images, which inflates
     table 1 by roughly 3 points.

The best_*.h5 checkpoints were also *selected* on this split (Keras
ModelCheckpoint monitors validation metrics), so even the de-duplicated
numbers are validation accuracy, not a fully unseen test set.

Run from the repo root with pureX.npy/dataX.npy/dataY.npy present.
Pass --plots to redraw the *_confusion_matrix.png files on the
de-duplicated split.
"""

import argparse
from datetime import date

import numpy as np
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import load_model

from model import (EMOTION_LABELS, TEST_RATIO, load_data, preprocess_data,
                   reshape_for_cnn)

# A validation row counts as a duplicate when its raw pixels are within this
# RMSE (gray levels, 0-255 scale) of some training row. Real distinct faces
# sit far above it; JPEG re-encodes of the same face sit below it.
DUP_RMSE = 3.5

PLOT_FILES = {
    "MLP (pixels)": "mlp_pixel_confusion_matrix.png",
    "MLP (landmarks)": "mlp_landmark_confusion_matrix.png",
    "CNN": "cnn_confusion_matrix.png",
    "VGG16 (fine-tuned)": "vgg16_confusion_matrix.png",
}

CHECKPOINTS = {
    "MLP (pixels)": "best_mlp_model.h5",
    "MLP (landmarks)": "best_lm_model.h5",
    "CNN": "best_cnn_model.h5",
    "VGG16 (fine-tuned)": "best_vgg_model.h5",
}


def predict(model_path: str, X: np.ndarray) -> np.ndarray:
    model = load_model(model_path)
    if model.input_shape[-1] == 3 and X.ndim == 4 and X.shape[-1] == 1:
        X = np.repeat(X, 3, axis=3)
    return model.predict(X, batch_size=64, verbose=0).argmax(axis=1)


def score(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "macro_f1": f1_score(y_true, y_pred, average="macro"),
        "per_class_f1": f1_score(y_true, y_pred, average=None),
        "n": len(y_true),
    }


def duplicate_mask(dataX_pixels: np.ndarray) -> np.ndarray:
    """True for validation rows that nearly duplicate a training row."""
    idx_train, idx_val = train_test_split(
        np.arange(len(dataX_pixels)), test_size=TEST_RATIO, random_state=42
    )
    P = dataX_pixels.astype(np.float32)
    Q, R = P[idx_val], P[idx_train]
    sq = (Q * Q).sum(1)[:, None] + (R * R).sum(1)[None, :] - 2 * Q @ R.T
    nn_rmse = np.sqrt(np.maximum(sq, 0).min(axis=1) / P.shape[1])
    return nn_rmse < DUP_RMSE


def print_table(title: str, results: dict) -> None:
    n = results["CNN"]["n"]
    print(f"\n## {title} ({n} samples, evaluated {date.today()})\n")
    header = "| Model | Accuracy | Macro-F1 | " + " | ".join(f"F1 {l}" for l in EMOTION_LABELS) + " |"
    print(header)
    print("|" + "---|" * (3 + len(EMOTION_LABELS)))
    for name, r in results.items():
        per_class = " | ".join(f"{v:.3f}" for v in r["per_class_f1"])
        print(f"| {name} | {r['accuracy']:.3f} | {r['macro_f1']:.3f} | {per_class} |")


def plot_confusion(name: str, y_true: np.ndarray, y_pred: np.ndarray) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    from sklearn.metrics import confusion_matrix

    cm = confusion_matrix(y_true, y_pred, labels=range(len(EMOTION_LABELS)))
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=EMOTION_LABELS, yticklabels=EMOTION_LABELS)
    plt.title(f"{name} confusion matrix (de-duplicated validation, n={len(y_true)})")
    plt.ylabel("True label")
    plt.xlabel("Predicted label")
    plt.tight_layout()
    plt.savefig(PLOT_FILES[name])
    plt.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--plots", action="store_true",
                        help="redraw confusion matrices on the de-duplicated split")
    args = parser.parse_args()

    dataX_pixels, dataX_landmarks, y_onehot = load_data()
    (_, X_test, _, y_test,
     _, X_test_lm, _, y_test_lm) = preprocess_data(dataX_pixels, dataX_landmarks, y_onehot)
    _, X_test_cnn = reshape_for_cnn(X_test, X_test)

    inputs = {
        "MLP (pixels)": (X_test, y_test),
        "MLP (landmarks)": (X_test_lm, y_test_lm),
        "CNN": (X_test_cnn, y_test),
        "VGG16 (fine-tuned)": (X_test_cnn, y_test),
    }

    dup = duplicate_mask(dataX_pixels)
    clean = ~dup
    print(f"Validation rows: {len(dup)}, near-duplicates of a training row: "
          f"{int(dup.sum())}, kept: {int(clean.sum())}")

    results_all, results_clean = {}, {}
    for name, path in CHECKPOINTS.items():
        X, y = inputs[name]
        print(f"Evaluating {name} ({path}) on {len(y)} samples...")
        y_true = y.argmax(axis=1)
        y_pred = predict(path, X)
        results_all[name] = score(y_true, y_pred)
        results_clean[name] = score(y_true[clean], y_pred[clean])
        if args.plots:
            plot_confusion(name, y_true[clean], y_pred[clean])

    print_table("All validation rows (leaky: includes near-duplicates of training rows)",
                results_all)
    print_table("De-duplicated validation rows", results_clean)
    print(
        "\nThe 10% split (`random_state=42`) was also used for checkpoint "
        "selection during training, so these are validation figures, not a "
        "fully unseen test set."
    )


if __name__ == "__main__":
    main()
