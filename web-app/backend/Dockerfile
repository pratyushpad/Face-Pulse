FROM python:3.10-slim

WORKDIR /app

# System deps for OpenCV headless (no libGL needed; libgl1-mesa-glx no
# longer exists in the Debian 12+ base images)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

# Model file and normalization_params.json should be present in the build context
# or set MODEL_PATH env var to point to a mounted volume / S3 path

EXPOSE 8000

CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "120", "main:app"]
