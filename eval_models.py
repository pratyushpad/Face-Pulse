"""
Evaluate the four saved checkpoints on the held-out validation split.

Reuses load_data/preprocess_data/reshape_for_cnn from model.py so the split
(train_test_split, test_size=0.1, random_state=42) and StandardScaler
normalization match training exactly.

Honesty note: the best_*.h5 checkpoints were *selected* on this same split
(Keras ModelCheckpoint monitors validation metrics), so these numbers are
validation accuracy, not clean test accuracy, and are mildly optimistic by
construction. Run from the repo root with pureX.npy/dataX.npy/dataY.npy present.
"""

from datetime import date

import numpy as np
from sklearn.metrics import accuracy_score, f1_score
from tensorflow.keras.models import load_model

from model import EMOTION_LABELS, load_data, preprocess_data, reshape_for_cnn

CHECKPOINTS = {
    "MLP (pixels)": "best_mlp_model.h5",
    "MLP (landmarks)": "best_lm_model.h5",
    "CNN": "best_cnn_model.h5",
    "VGG16 (fine-tuned)": "best_vgg_model.h5",
}


def evaluate(model_path: str, X: np.ndarray, y_onehot: np.ndarray) -> dict:
    model = load_model(model_path)
    if model.input_shape[-1] == 3 and X.ndim == 4 and X.shape[-1] == 1:
        X = np.repeat(X, 3, axis=3)
    probs = model.predict(X, batch_size=64, verbose=0)
    y_true = y_onehot.argmax(axis=1)
    y_pred = probs.argmax(axis=1)
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "macro_f1": f1_score(y_true, y_pred, average="macro"),
        "per_class_f1": f1_score(y_true, y_pred, average=None),
        "n": len(y_true),
    }


def main() -> None:
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

    results = {}
    for name, path in CHECKPOINTS.items():
        X, y = inputs[name]
        print(f"Evaluating {name} ({path}) on {len(y)} samples...")
        results[name] = evaluate(path, X, y)

    n = results["CNN"]["n"]
    print(f"\n## Results ({n} samples, held-out validation split*, evaluated {date.today()})\n")
    header = "| Model | Accuracy | Macro-F1 | " + " | ".join(f"F1 {l}" for l in EMOTION_LABELS) + " |"
    print(header)
    print("|" + "---|" * (3 + len(EMOTION_LABELS)))
    for name, r in results.items():
        per_class = " | ".join(f"{v:.3f}" for v in r["per_class_f1"])
        print(f"| {name} | {r['accuracy']:.3f} | {r['macro_f1']:.3f} | {per_class} |")
    print(
        "\n\\* 10% split (`random_state=42`) also used for checkpoint selection "
        "during training, so figures are validation accuracy and mildly "
        "optimistic compared to a fully unseen test set."
    )


if __name__ == "__main__":
    main()
