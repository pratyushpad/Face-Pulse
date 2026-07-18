# Emotion Detection with Neural Networks & CNNs

[![CI](https://github.com/Pratyushpad27/fer2013-emotion-detection/actions/workflows/ci.yml/badge.svg)](https://github.com/Pratyushpad27/fer2013-emotion-detection/actions/workflows/ci.yml)

A deep learning project that detects **5 human emotions** from facial images using progressively more advanced neural network architectures — from a basic MLP all the way to transfer learning with VGG16.

**[Live Demo](https://emotion-detec.netlify.app/)** — try it with your webcam!

## Emotions Detected
Angry · Happy · Sad · Surprise · Fear

## Results

Measured with `python eval_models.py` on 2,000 samples (10% held-out validation split\*, evaluated 2026-07-18):

| Model | Accuracy | Macro-F1 | F1 Angry | F1 Happy | F1 Sad | F1 Surprise | F1 Fear |
|---|---|---|---|---|---|---|---|
| MLP (pixels) | 43.6% | 0.430 | 0.306 | 0.490 | 0.370 | 0.564 | 0.418 |
| MLP (landmarks) | 51.7% | 0.507 | 0.468 | 0.633 | 0.304 | 0.699 | 0.433 |
| **CNN** | **64.5%** | **0.647** | 0.559 | 0.757 | 0.523 | 0.836 | 0.558 |
| VGG16 (fine-tuned) | 64.3% | 0.643 | 0.575 | 0.734 | 0.522 | 0.808 | 0.574 |

\* The 10% split (`random_state=42`) was also used for checkpoint selection during training, so these are validation figures and mildly optimistic compared to a fully unseen test set. For context, reported human accuracy on FER2013 is around 65%.

## Web App

Real-time emotion detection app with live webcam analysis:

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Framer Motion + Chart.js — deployed on Netlify. The live demo runs fully in the browser using face-api.js, so it works without a server.
- **Backend**: FastAPI + OpenCV (Haar cascade face detection) + TensorFlow (VGG16 inference) — a self-hostable API (Dockerfile included) serving the models trained in this repo. Not used by the hosted demo.

Features:
- Real-time webcam emotion detection with face bounding box overlay
- Emotion probability bar chart and session timeline
- Session analytics with breakdown charts
- Model architecture info page
- Interactive API documentation with file upload tester

## Models Built
| Model | Input | Description |
|-------|-------|-------------|
| MLP (Pixels) | Raw pixel values | Fully connected neural network on flattened 48x48 images |
| MLP (Landmarks) | Facial landmark distances | MLP trained on geometric distances between facial keypoints |
| CNN | 48x48 grayscale images | Convolutional network with batch normalization and dropout |
| VGG16 Transfer Learning | 48x48 images | Pretrained ImageNet model with 2-phase fine-tuning (block4 + block5 unfrozen) |

## Dataset
[FER2013](https://www.kaggle.com/datasets/msambare/fer2013) — Facial Expression Recognition dataset containing 35,000+ grayscale face images across 7 emotion categories (this project uses 5).

## Tech Stack

**ML Training:**
- Python 3, TensorFlow / Keras
- NumPy, Pandas, scikit-learn
- OpenCV, dlib (facial landmark extraction)
- Matplotlib, Seaborn

**Web App:**
- React 18 + TypeScript + Vite + Tailwind CSS
- FastAPI + Uvicorn (self-hostable backend, Docker)
- Chart.js, Framer Motion
- Netlify (hosted frontend demo)

## Project Structure
```
emotion-detection-cnn/
│
├── model.py                  # All 4 model definitions + training pipeline
├── eval_models.py            # Evaluate saved checkpoints → results table
├── data_prep.py              # Downloads .npy feature data + dlib landmark model
├── scripts/
│   └── download_assets.py    # Fetch datasets and model checkpoints
├── sample_images/            # A few FER2013 test faces for quick demos
│
├── web-app/
│   ├── backend/              # FastAPI server + model inference
│   │   ├── main.py           # API routes (/detect, /health, /model-info)
│   │   ├── model_loader.py   # Keras model loading + StandardScaler normalization
│   │   ├── tests/            # pytest suite (runs without TensorFlow)
│   │   └── Dockerfile
│   └── frontend/             # React + TypeScript SPA
│       ├── src/pages/        # Landing, Detect, Analytics, ModelInfo, ApiDocs
│       ├── src/components/   # CameraFeed, EmotionBarChart, Navbar, etc.
│       └── src/hooks/        # useCamera, useFaceDetection
│
├── pureX.npy                 # Pixel feature data        (via download_assets.py)
├── dataX.npy                 # Landmark distance data    (via download_assets.py)
└── dataY.npy                 # Emotion labels            (via download_assets.py)
```

## How to Run Locally

**1. Clone the repo**
```bash
git clone https://github.com/Pratyushpad27/fer2013-emotion-detection.git
cd fer2013-emotion-detection
```

**2. Download data + pretrained models**
```bash
python scripts/download_assets.py --models   # .npy arrays, dlib .dat, .h5 checkpoints
```
(FER2013 train/test image folders, if you want them, come from
[Kaggle](https://www.kaggle.com/datasets/msambare/fer2013): `kaggle datasets download -d msambare/fer2013`.)

**3. Train the models** (optional — pretrained checkpoints available via step 2)
```bash
pip install tensorflow numpy pandas scikit-learn opencv-python matplotlib seaborn dlib
python model.py
```

**4. Evaluate the checkpoints**
```bash
python eval_models.py   # prints the results table above
```

**5. Run the web app**
```bash
# Backend
cd web-app/backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd web-app/frontend
npm install
npm run dev
```

Open `http://localhost:5175` in your browser.

## Key Takeaways
- The CNN and the fine-tuned VGG16 land within 0.2 points of each other (64.5% vs 64.3%) — see the Results table above for the measured numbers
- StandardScaler normalization matched between training and inference for consistent predictions
- Data augmentation (rotation, shifts, flips, zoom) to combat FER2013 label noise

## What I Learned
- Flattening images into vectors loses all spatial information — that's why my MLP on raw pixels performed the worst
- Two-phase fine-tuning made a huge difference: freezing VGG16 first, then unfreezing the last 2 blocks with a 10x lower LR to avoid blowing away the pretrained weights
- FER2013 labels are noisy (some images are mislabeled) — data augmentation helped the model generalize instead of memorizing bad labels
- Getting training normalization to match inference normalization was a pain — I had to export the StandardScaler params to JSON and load them in the backend
- Output-index order matters: the checkpoints' class order wasn't alphabetical, and I only caught the mislabeling by running the trained models against labeled test images — always verify the label mapping empirically
- Packaging a TensorFlow backend in Docker means thinking about model file size (~157MB) and cold-start time up front
- Canvas overlay rendering at 60fps while simultaneously capturing frames for inference every 500ms — had to be careful with requestAnimationFrame vs setInterval

## Author
Pratyush Padhy — UCI CS '28
[GitHub](https://github.com/Pratyushpad27) · [LinkedIn](https://www.linkedin.com/in/pratyush-padhy-b7017a269/)

## Training Curves & Confusion Matrices

### MLP (Pixel Inputs)
![MLP Pixel Training](mlp_pixel_training.png)
![MLP Pixel Confusion Matrix](mlp_pixel_confusion_matrix.png)

### MLP (Landmark Inputs)
![MLP Landmarks Training](mlp_landmarks_training.png)
![MLP Landmark Confusion Matrix](mlp_landmark_confusion_matrix.png)

### CNN
![CNN Training](cnn_training.png)
![CNN Confusion Matrix](cnn_confusion_matrix.png)

### VGG16 Transfer Learning
![VGG16 Training](vgg16_transfer_learning_training.png)
![VGG16 Confusion Matrix](vgg16_confusion_matrix.png)

### Model Comparison
![Model Comparison](model_comparison.png)
