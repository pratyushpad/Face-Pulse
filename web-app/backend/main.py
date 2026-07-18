"""
FastAPI backend for real-time emotion detection.
Accepts base64 JPEG frames, runs Haar cascade face detection + VGG16 inference.
"""

import base64
import logging
import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model_loader import EmotionModelLoader

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("emotion_api")

_DEFAULT_MODEL = str(Path(__file__).resolve().parent.parent.parent / "best_vgg_model.h5")
MODEL_PATH: str = os.getenv("MODEL_PATH", _DEFAULT_MODEL)
CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "*")

MAX_UPLOAD_BYTES: int = 5 * 1024 * 1024  # 5 MB multipart upload cap
MAX_BASE64_CHARS: int = 7_000_000  # ~5 MB decoded

FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

emotion_model: Optional[EmotionModelLoader] = None

# Neither CascadeClassifier.detectMultiScale nor Keras Model.predict is
# thread-safe, and run_in_threadpool may run requests on different threads.
_detection_lock = threading.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global emotion_model
    logger.info("Starting Emotion Detection API")
    try:
        emotion_model = EmotionModelLoader(MODEL_PATH)
        # Warm-up: pay the TF graph-build cost now, not on the first request.
        emotion_model.predict(np.zeros((48, 48), dtype=np.uint8))
        logger.info("Model ready.")
    except Exception:
        logger.exception(
            "Could not load model from %s — detect endpoints will return 503.",
            MODEL_PATH,
        )
        emotion_model = None
    yield
    logger.info("Shutting down API.")


app = FastAPI(
    title="Emotion Detection API",
    description="Real-time facial emotion detection powered by FER2013 CNN",
    version="1.1.0",
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
        logger.warning("Image decode error: %s", e)
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


def _require_model() -> EmotionModelLoader:
    if emotion_model is None or not emotion_model.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded — detection is unavailable.",
        )
    return emotion_model


def _run_detection_sync(frame: np.ndarray) -> DetectionResponse:
    """CPU-bound detection + inference; called via run_in_threadpool."""
    model = _require_model()

    with _detection_lock:
        face_crop, face_box = detect_largest_face(frame)

        if face_crop is None:
            return DetectionResponse(
                emotions={label: 0.0 for label in model.emotion_labels},
                dominant="",
                confidence=0.0,
                face_detected=False,
                face_box=None,
            )

        try:
            emotion_probs = model.predict(face_crop)
        except Exception as e:
            logger.exception("Inference error")
            raise HTTPException(status_code=500, detail=f"Model inference failed: {e}")

    dominant = max(emotion_probs, key=emotion_probs.get)

    return DetectionResponse(
        emotions=emotion_probs,
        dominant=dominant,
        confidence=round(float(emotion_probs[dominant]), 4),
        face_detected=True,
        face_box=FaceBoxSchema(**face_box),
    )


@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "ok",
        "model_loaded": emotion_model is not None and emotion_model.is_loaded,
    }


@app.get("/api/model-info")
async def model_info() -> dict:
    return _require_model().model_info


@app.post("/api/detect", response_model=DetectionResponse)
async def detect_emotion(request: DetectionRequest) -> DetectionResponse:
    _require_model()

    if len(request.image) > MAX_BASE64_CHARS:
        raise HTTPException(status_code=413, detail="Image payload too large (max ~5MB).")

    frame = decode_base64_image(request.image)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image data.")

    return await run_in_threadpool(_run_detection_sync, frame)


@app.post("/api/detect-image", response_model=DetectionResponse)
async def detect_from_image(file: UploadFile = File(...)) -> DetectionResponse:
    _require_model()

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image file too large (max 5MB).")

    img_array = np.frombuffer(contents, dtype=np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image file.")

    return await run_in_threadpool(_run_detection_sync, frame)
