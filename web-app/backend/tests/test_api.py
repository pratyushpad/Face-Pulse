import main
from conftest import jpeg_base64, jpeg_bytes


def test_health_loaded(client_loaded):
    r = client_loaded.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "model_loaded": True}


def test_health_unloaded(client_unloaded):
    r = client_unloaded.get("/api/health")
    assert r.status_code == 200
    assert r.json()["model_loaded"] is False


def test_model_info_unloaded_503(client_unloaded):
    assert client_unloaded.get("/api/model-info").status_code == 503


def test_detect_unloaded_503(client_unloaded):
    r = client_unloaded.post("/api/detect", json={"image": jpeg_base64()})
    assert r.status_code == 503


def test_detect_image_unloaded_503(client_unloaded):
    r = client_unloaded.post(
        "/api/detect-image", files={"file": ("f.jpg", jpeg_bytes(), "image/jpeg")}
    )
    assert r.status_code == 503


def test_detect_invalid_base64_400(client_loaded):
    r = client_loaded.post("/api/detect", json={"image": "!!!not-base64!!!"})
    assert r.status_code == 400


def test_detect_oversized_base64_413(client_loaded):
    r = client_loaded.post("/api/detect", json={"image": "A" * (main.MAX_BASE64_CHARS + 1)})
    assert r.status_code == 413


def test_detect_image_oversized_413(client_loaded):
    big = b"\x00" * (main.MAX_UPLOAD_BYTES + 1)
    r = client_loaded.post(
        "/api/detect-image", files={"file": ("big.jpg", big, "image/jpeg")}
    )
    assert r.status_code == 413


def test_detect_no_face(client_loaded):
    r = client_loaded.post("/api/detect", json={"image": jpeg_base64()})
    assert r.status_code == 200
    body = r.json()
    assert body["face_detected"] is False
    assert body["dominant"] == ""
    assert set(body["emotions"]) == {"angry", "fear", "happy", "sad", "surprise"}


def test_detect_happy_path(client_loaded, monkeypatch):
    import numpy as np

    monkeypatch.setattr(
        main,
        "detect_largest_face",
        lambda frame: (np.zeros((48, 48), dtype=np.uint8), {"x": 1, "y": 2, "w": 3, "h": 4}),
    )
    r = client_loaded.post("/api/detect", json={"image": jpeg_base64()})
    assert r.status_code == 200
    body = r.json()
    assert body["face_detected"] is True
    assert body["dominant"] == "happy"
    assert body["confidence"] == 0.8
    assert body["face_box"] == {"x": 1, "y": 2, "w": 3, "h": 4}


def test_detect_image_happy_path(client_loaded, monkeypatch):
    import numpy as np

    monkeypatch.setattr(
        main,
        "detect_largest_face",
        lambda frame: (np.zeros((48, 48), dtype=np.uint8), {"x": 1, "y": 2, "w": 3, "h": 4}),
    )
    r = client_loaded.post(
        "/api/detect-image", files={"file": ("f.jpg", jpeg_bytes(), "image/jpeg")}
    )
    assert r.status_code == 200
    assert r.json()["dominant"] == "happy"
