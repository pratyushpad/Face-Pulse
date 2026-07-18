"""Shared fixtures. Tests run without TensorFlow or the .h5 file:
TestClient is used without a context manager so lifespan (model load) never runs,
and the loaded-model state is faked by monkeypatching main.emotion_model.
"""

import base64
import sys
from pathlib import Path

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import main  # noqa: E402

EMOTION_LABELS = ["angry", "fear", "happy", "sad", "surprise"]


class FakeLoader:
    """Stands in for EmotionModelLoader without importing TensorFlow."""

    is_loaded = True
    emotion_labels = EMOTION_LABELS
    model_info = {
        "model": "fake.h5",
        "classes": EMOTION_LABELS,
        "n_classes": 5,
        "parameters": 42,
        "input_shape": [None, 48, 48, 3],
        "normalization": "StandardScaler",
    }

    def predict(self, face_gray):
        return {"angry": 0.05, "fear": 0.05, "happy": 0.8, "sad": 0.05, "surprise": 0.05}


@pytest.fixture
def client_unloaded(monkeypatch):
    monkeypatch.setattr(main, "emotion_model", None)
    return TestClient(main.app)


@pytest.fixture
def client_loaded(monkeypatch):
    monkeypatch.setattr(main, "emotion_model", FakeLoader())
    return TestClient(main.app)


def jpeg_bytes(size: int = 64) -> bytes:
    """A valid JPEG (gray gradient) that contains no detectable face."""
    img = np.tile(np.linspace(0, 255, size, dtype=np.uint8), (size, 1))
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    return buf.tobytes()


def jpeg_base64(size: int = 64) -> str:
    return base64.b64encode(jpeg_bytes(size)).decode()
