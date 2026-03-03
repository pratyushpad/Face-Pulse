"""
Emotion Model Loader
====================
Handles loading, preprocessing, and inference for the Keras emotion CNN.

Supports both 5-class (angry/fear/happy/sad/surprise) and
7-class (+ disgust/neutral) models — auto-detects from output shape.

Normalization: loads StandardScaler params from normalization_params.json
if available (run prepare_model.py first). Falls back to /255 normalization.
"""

import json
import numpy as np
from pathlib import Path
from typing import Optional

# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────

IMG_SIZE: int = 48

EMOTION_LABELS_5: list[str] = ["angry", "fear", "happy", "sad", "surprise"]
EMOTION_LABELS_7: list[str] = [
    "angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"
]


class EmotionModelLoader:
    """
    Wraps a Keras emotion classification model with preprocessing and inference.

    Automatically detects the number of output classes and applies the correct
    emotion labels. Uses StandardScaler normalization if params are saved,
    otherwise falls back to simple /255 normalization.
    """

    def __init__(self, model_path: str) -> None:
        """
        Initialize and load the model from the given path.

        Args:
            model_path: Absolute or relative path to the .h5 or .keras model file.

        Raises:
            FileNotFoundError: If the model file does not exist.
            ValueError: If the model output shape is not 5 or 7 classes.
        """
        self.model_path = Path(model_path)
        self.model = None
        self.emotion_labels: list[str] = EMOTION_LABELS_5
        self.is_loaded: bool = False
        self.normalization_params: Optional[dict] = None
        self._load()

    def _load(self) -> None:
        """Load the Keras model and optional normalization parameters."""
        import tensorflow as tf  # import here to avoid startup delay if TF not needed

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model file not found: {self.model_path.resolve()}\n"
                "Make sure best_vgg_model.h5 is in the emotion-detection-cnn directory."
            )

        print(f"Loading model from {self.model_path.resolve()}...")
        self.model = tf.keras.models.load_model(str(self.model_path))

        # Auto-detect number of output classes
        n_classes: int = self.model.output_shape[-1]
        if n_classes == 7:
            self.emotion_labels = EMOTION_LABELS_7
        elif n_classes == 5:
            self.emotion_labels = EMOTION_LABELS_5
        else:
            raise ValueError(
                f"Unexpected model output: {n_classes} classes. "
                "Expected 5 or 7."
            )

        # Load StandardScaler normalization params if prepared
        norm_path = Path(__file__).parent / "normalization_params.json"
        if norm_path.exists():
            with open(norm_path) as f:
                self.normalization_params = json.load(f)
            print(f"Loaded normalization params from {norm_path}")
        else:
            print(
                "normalization_params.json not found — using /255 normalization.\n"
                "Run 'python prepare_model.py' for better accuracy."
            )

        self.is_loaded = True
        print(
            f"Model loaded: {n_classes} classes → {self.emotion_labels}\n"
            f"Total parameters: {self.model.count_params():,}"
        )

    def _preprocess(self, face_gray: np.ndarray) -> np.ndarray:
        """
        Preprocess a 48x48 grayscale face crop for model inference.

        Applies the same normalization used during training, then reshapes
        to (1, 48, 48, C) where C is 1 or 3 depending on model input.

        Args:
            face_gray: Grayscale face crop of shape (48, 48), dtype uint8.

        Returns:
            Preprocessed array ready for model.predict().
        """
        face = face_gray.astype(np.float32)
        flat = face.flatten().reshape(1, -1)  # shape: (1, 2304)

        if self.normalization_params is not None:
            mean = np.array(self.normalization_params["mean"], dtype=np.float32)
            std = np.array(self.normalization_params["std"], dtype=np.float32)
            # Avoid division by zero
            std = np.where(std < 1e-8, 1e-8, std)
            flat = (flat - mean) / std
        else:
            flat = flat / 255.0

        reshaped = flat.reshape(1, IMG_SIZE, IMG_SIZE, 1)

        # VGG16 and other models expect 3-channel input
        expected_channels: int = self.model.input_shape[-1]
        if expected_channels == 3:
            return np.repeat(reshaped, 3, axis=3)

        return reshaped

    def predict(self, face_gray: np.ndarray) -> dict[str, float]:
        """
        Run emotion classification on a preprocessed face crop.

        Args:
            face_gray: Grayscale face crop of shape (48, 48), dtype uint8.

        Returns:
            Dict mapping emotion name to softmax probability (0.0–1.0).
        """
        preprocessed = self._preprocess(face_gray)
        preds: np.ndarray = self.model.predict(preprocessed, verbose=0)[0]
        return {
            label: round(float(prob), 4)
            for label, prob in zip(self.emotion_labels, preds)
        }

    @property
    def model_info(self) -> dict:
        """Return a metadata dict about the loaded model."""
        if not self.is_loaded or self.model is None:
            return {"model": "not_loaded"}
        return {
            "model": str(self.model_path.name),
            "classes": self.emotion_labels,
            "n_classes": len(self.emotion_labels),
            "parameters": self.model.count_params(),
            "input_shape": list(self.model.input_shape),
            "normalization": (
                "StandardScaler" if self.normalization_params else "divide_by_255"
            ),
        }
