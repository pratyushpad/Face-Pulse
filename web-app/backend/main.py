"""
FastAPI backend for real-time emotion detection.
Accepts base64 JPEG frames, runs Haar cascade face detection + VGG16 inference.
"""

import base64
import os
import random
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model_loader import EmotionModelLoader

load_dotenv()

_DEFAULT_MODEL = str(Path(__file__).resolve().parent.parent.parent / "best_vgg_model.h5")
MODEL_PATH: str = os.getenv("MODEL_PATH", _DEFAULT_MODEL)
CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "*")

DEMO_EMOTION_LABELS: list[str] = ["angry", "fear", "happy", "sad", "surprise"]

FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

emotion_model: Optional[EmotionModelLoader] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global emotion_model
    print("=" * 50)
    print("Starting Emotion Detection API")
    print("=" * 50)
    try:
        emotion_model = EmotionModelLoader(MODEL_PATH)
        print("Model ready.")
    except Exception as e:
        print(f"WARNING: Could not load model — running in demo mode.\nReason: {e}")
        emotion_model = None
    yield
    print("Shutting down API.")


app = FastAPI(
    title="Emotion Detection API",
    description="Real-time facial emotion detection powered by FER2013 CNN",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGIN.split(",") if CORS_ORIGIN != "*" else ["*"],
    allow_credentials=CORS_ORIGIN != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)


class DetectionRequest(BaseModel):
    image: str  # base64 data URL


class FaceBoxSchema(BaseModel):
    x: int
    y: int
    w: int
    h: int


class DetectionResponse(BaseModel):
    emotions: dict[str, float]
    dominant: str
    confidence: float
    face_detected: bool
    face_box: Optional[FaceBoxSchema]


def decode_base64_image(data_url: str) -> Optional[np.ndarray]:
    try:
        if "," in data_url:
            data_url = data_url.split(",", 1)[1]
        img_bytes = base64.b64decode(data_url)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        return cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"Image decode error: {e}")
        return None


def detect_largest_face(
    frame: np.ndarray,
) -> tuple[Optional[np.ndarray], Optional[dict]]:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
    )

    if len(faces) == 0:
        return None, None

    x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
    face_crop = gray[y : y + h, x : x + w]
    face_resized = cv2.resize(face_crop, (48, 48))

    return face_resized, {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}


def mock_predictions(emotion_labels: list[str]) -> dict[str, float]:
    """Random softmax-style predictions for demo mode."""
    raw = [random.random() for _ in emotion_labels]
    total = sum(raw)
    return {label: round(v / total, 4) for label, v in zip(emotion_labels, raw)}


@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "ok",
        "model_loaded": emotion_model is not None and emotion_model.is_loaded,
        "demo_mode": emotion_model is None,
    }


@app.get("/api/model-info")
async def model_info() -> dict:
    if emotion_model is None or not emotion_model.is_loaded:
        return {
            "model": "demo_mode",
            "classes": DEMO_EMOTION_LABELS,
            "parameters": 0,
            "normalization": "none",
        }
    return emotion_model.model_info


@app.post("/api/detect", response_model=DetectionResponse)
async def detect_emotion(request: DetectionRequest) -> DetectionResponse:
    frame = decode_base64_image(request.image)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image data.")

    face_crop, face_box = detect_largest_face(frame)

    if face_crop is None:
        labels = (
            emotion_model.emotion_labels
            if emotion_model and emotion_model.is_loaded
            else DEMO_EMOTION_LABELS
        )
        return DetectionResponse(
            emotions={label: 0.0 for label in labels},
            dominant="",
            confidence=0.0,
            face_detected=False,
            face_box=None,
        )

    try:
        if emotion_model is not None and emotion_model.is_loaded:
            emotion_probs = emotion_model.predict(face_crop)
        else:
            emotion_probs = mock_predictions(DEMO_EMOTION_LABELS)
    except Exception as e:
        print(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Model inference failed: {e}")

    dominant = max(emotion_probs, key=emotion_probs.get)
    confidence = emotion_probs[dominant]

    return DetectionResponse(
        emotions=emotion_probs,
        dominant=dominant,
        confidence=round(float(confidence), 4),
        face_detected=True,
        face_box=FaceBoxSchema(**face_box),
    )


@app.post("/api/detect-image", response_model=DetectionResponse)
async def detect_from_image(file: UploadFile = File(...)) -> DetectionResponse:
    contents = await file.read()
    img_array = np.frombuffer(contents, dtype=np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image file.")

    face_crop, face_box = detect_largest_face(frame)

    if face_crop is None:
        labels = (
            emotion_model.emotion_labels
            if emotion_model and emotion_model.is_loaded
            else DEMO_EMOTION_LABELS
        )
        return DetectionResponse(
            emotions={label: 0.0 for label in labels},
            dominant="",
            confidence=0.0,
            face_detected=False,
            face_box=None,
        )

    try:
        if emotion_model is not None and emotion_model.is_loaded:
            emotion_probs = emotion_model.predict(face_crop)
        else:
            emotion_probs = mock_predictions(DEMO_EMOTION_LABELS)
    except Exception as e:
        print(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Model inference failed: {e}")

    dominant = max(emotion_probs, key=emotion_probs.get)
    confidence = emotion_probs[dominant]

    return DetectionResponse(
        emotions=emotion_probs,
        dominant=dominant,
        confidence=round(float(confidence), 4),
        face_detected=True,
        face_box=FaceBoxSchema(**face_box),
    )
