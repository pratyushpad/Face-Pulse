"""
Emotion Detection FastAPI Backend
===================================
Real-time facial emotion detection API.

Accepts base64-encoded JPEG frames from the browser, runs Haar cascade face
detection with OpenCV, crops the face region, and classifies emotion using a
pre-trained Keras CNN (VGG16 transfer learning on FER2013).

Routes:
    POST /api/detect      — Run emotion inference on a webcam frame
    GET  /api/health      — Health check + model loaded status
    GET  /api/model-info  — Model metadata

Usage:
    cd web-app/backend
    uvicorn main:app --reload --port 8000
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

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

_DEFAULT_MODEL = str(Path(__file__).resolve().parent.parent.parent / "best_vgg_model.h5")
MODEL_PATH: str = os.getenv("MODEL_PATH", _DEFAULT_MODEL)
CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "*")

# Fallback emotion labels used in demo/mock mode (5 classes to match existing model)
DEMO_EMOTION_LABELS: list[str] = ["angry", "fear", "happy", "sad", "surprise"]

# OpenCV Haar cascade for frontal face detection
FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# ─────────────────────────────────────────────
# GLOBAL STATE
# ─────────────────────────────────────────────

emotion_model: Optional[EmotionModelLoader] = None


# ─────────────────────────────────────────────
# LIFESPAN — load model on startup
# ─────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load the emotion model at startup so the first request is instant."""
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


# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
# PYDANTIC SCHEMAS
# ─────────────────────────────────────────────


class DetectionRequest(BaseModel):
    """Request body for POST /api/detect."""
    image: str  # base64 data URL, e.g. "data:image/jpeg;base64,..."


class FaceBoxSchema(BaseModel):
    """Bounding box of detected face in original frame pixel coordinates."""
    x: int
    y: int
    w: int
    h: int


class DetectionResponse(BaseModel):
    """Response from POST /api/detect."""
    emotions: dict[str, float]        # e.g. {"happy": 0.82, "sad": 0.06, ...}
    dominant: str                      # name of highest-confidence emotion
    confidence: float                  # probability of dominant emotion
    face_detected: bool               # whether a face was found in the frame
    face_box: Optional[FaceBoxSchema]  # bounding box coords, null if no face


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────


def decode_base64_image(data_url: str) -> Optional[np.ndarray]:
    """
    Decode a base64 data URL into an OpenCV BGR image array.

    Args:
        data_url: Data URL string, with or without the 'data:...' prefix.

    Returns:
        BGR image as numpy array, or None if decoding fails.
    """
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
    """
    Use OpenCV Haar cascade to detect the largest face in a BGR frame.

    Args:
        frame: BGR image as numpy array.

    Returns:
        Tuple of (face_crop_grayscale_48x48, face_box_dict) or (None, None).
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = FACE_CASCADE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
    )

    if len(faces) == 0:
        return None, None

    # Pick the largest detected face by area
    x, y, w, h = max(faces, key=lambda face: face[2] * face[3])

    face_crop = gray[y : y + h, x : x + w]
    face_resized = cv2.resize(face_crop, (48, 48))

    return face_resized, {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}


def mock_predictions(emotion_labels: list[str]) -> dict[str, float]:
    """
    Generate plausible-looking mock emotion probabilities for demo mode.

    Creates a softmax-style distribution so values sum to 1.0.

    Args:
        emotion_labels: List of emotion class names.

    Returns:
        Dict mapping each emotion to a random probability.
    """
    raw = [random.random() for _ in emotion_labels]
    total = sum(raw)
    return {label: round(v / total, 4) for label, v in zip(emotion_labels, raw)}


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────


@app.get("/api/health")
async def health() -> dict:
    """
    Health check endpoint.

    Returns whether the server is running and the model is loaded.
    """
    return {
        "status": "ok",
        "model_loaded": emotion_model is not None and emotion_model.is_loaded,
        "demo_mode": emotion_model is None,
    }


@app.get("/api/model-info")
async def model_info() -> dict:
    """
    Return metadata about the loaded emotion model.

    Includes class labels, parameter count, input shape, and normalization type.
    """
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
    """
    Detect emotion from a base64-encoded webcam frame.

    Pipeline:
    1. Decode base64 JPEG → OpenCV BGR array
    2. Haar cascade → crop largest face → resize to 48x48
    3. Normalize → run CNN → softmax probabilities
    4. Return dominant emotion, confidence, and face bounding box

    Returns face_detected: false (with zero scores) if no face is found.
    """
    # Decode the incoming image
    frame = decode_base64_image(request.image)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image data.")

    # Detect face region
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

    # Run model inference (or mock predictions in demo mode)
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
    """
    Detect emotion from an uploaded image file (JPEG, PNG, WebP).

    Accepts multipart/form-data with a single 'file' field.
    Useful for testing the API without a webcam.
    """
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
