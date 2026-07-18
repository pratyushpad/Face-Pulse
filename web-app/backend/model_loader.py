"""
Loads the Keras emotion model and handles preprocessing + inference.
Supports both 5-class and 7-class models (auto-detects from output shape).
Uses StandardScaler normalization params if available, otherwise falls back to /255.
"""

import json
import logging

import numpy as np
from pathlib import Path
from typing import Optional

logger = logging.getLogger("emotion_api.model_loader")

IMG_SIZE: int = 48

# Order matches the training labels in dataY.npy (verified empirically against
# labeled FER2013 images with the trained checkpoints) — NOT alphabetical.
EMOTION_LABELS_5: list[str] = ["angry", "happy", "sad", "surprise", "fear"]
EMOTION_LABELS_7: list[str] = [
    "angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"
]


class EmotionModelLoader:
    def __init__(self, model_path: str) -> None:
        self.model_path = Path(model_path)
        self.model = None
        self.emotion_labels: list[str] = EMOTION_LABELS_5
        self.is_loaded: bool = False
        self.normalization_params: Optional[dict] = None
        self._load()

    def _load(self) -> None:
        import tensorflow as tf

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model file not found: {self.model_path.resolve()}\n"
                "Make sure best_vgg_model.h5 is in the emotion-detection-cnn directory."
            )

        logger.info("Loading model from %s...", self.model_path.resolve())
        self.model = tf.keras.models.load_model(str(self.model_path))

        n_classes: int = self.model.output_shape[-1]
        if n_classes == 7:
            self.emotion_labels = EMOTION_LABELS_7
        elif n_classes == 5:
            self.emotion_labels = EMOTION_LABELS_5
        else:
            raise ValueError(
                f"Unexpected model output: {n_classes} classes. Expected 5 or 7."
            )

        # Load StandardScaler params if available (exported by model.py during training)
        norm_path = Path(__file__).parent / "normalization_params.json"
        if norm_path.exists():
            with open(norm_path) as f:
                self.normalization_params = json.load(f)
            logger.info("Loaded normalization params from %s", norm_path)
        else:
            logger.warning(
                "normalization_params.json not found — using /255 normalization. "
                "Run 'python prepare_model.py' for better accuracy."
            )

        self.is_loaded = True
        logger.info(
            "Model loaded: %d classes → %s (%s parameters)",
            n_classes,
            self.emotion_labels,
            f"{self.model.count_params():,}",
        )

    def _preprocess(self, face_gray: np.ndarray) -> np.ndarray:
        """Normalize and reshape a 48x48 grayscale face for inference."""
        face = face_gray.astype(np.float32)
        flat = face.flatten().reshape(1, -1)  # (1, 2304)

        if self.normalization_params is not None:
            mean = np.array(self.normalization_params["mean"], dtype=np.float32)
            std = np.array(self.normalization_params["std"], dtype=np.float32)
            std = np.where(std < 1e-8, 1e-8, std)
            flat = (flat - mean) / std
        else:
            flat = flat / 255.0

        reshaped = flat.reshape(1, IMG_SIZE, IMG_SIZE, 1)

        # VGG16 expects 3-channel input
        expected_channels: int = self.model.input_shape[-1]
        if expected_channels == 3:
            return np.repeat(reshaped, 3, axis=3)

        return reshaped

    def predict(self, face_gray: np.ndarray) -> dict[str, float]:
        """Run the model on a 48x48 grayscale face crop, return emotion probabilities."""
        preprocessed = self._preprocess(face_gray)
        preds: np.ndarray = self.model.predict(preprocessed, verbose=0)[0]
        return {
            label: round(float(prob), 4)
            for label, prob in zip(self.emotion_labels, preds)
        }

    @property
    def model_info(self) -> dict:
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
