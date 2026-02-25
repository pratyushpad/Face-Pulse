# Emotion Detection with Neural Networks & CNNs

A deep learning project that detects **5 human emotions** from facial images using progressively more advanced neural network architectures — from a basic MLP all the way to transfer learning with VGG16.

## Emotions Detected
Angry · Fear · Happy · Sad · Surprise

## Models Built
| Model | Input | Description |
|-------|-------|-------------|
| MLP (Pixels) | Raw pixel values | Fully connected neural network on flattened 48x48 images |
| MLP (Landmarks) | Facial landmark distances | MLP trained on geometric distances between facial keypoints |
| CNN | 48x48 grayscale images | Convolutional network with batch normalization and dropout |
| VGG16 Transfer Learning | 48x48 images | Pretrained ImageNet model fine-tuned for emotion classification |

## Dataset
[FER2013](https://www.kaggle.com/datasets/msambare/fer2013) — Facial Expression Recognition dataset containing 35,000+ grayscale face images across 7 emotion categories (this project uses 5).

## Tech Stack
- Python 3
- TensorFlow / Keras
- NumPy, Pandas
- scikit-learn
- OpenCV (dlib for facial landmark extraction)
- Matplotlib, Seaborn

## Project Structure
```
emotion-detection-cnn/
│
├── model.py                  # All model definitions and training pipeline
├── notebook.ipynb            # Original exploratory notebook
├── README.md
│
├── pureX.npy                 # Pixel feature data (generated from preprocessing)
├── dataX.npy                 # Landmark distance data
├── dataY.npy                 # Emotion labels
│
└── plots/
    ├── mlp_pixel_training.png
    ├── cnn_training.png
    ├── model_comparison.png
    └── ...
```

## How to Run

**1. Clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/emotion-detection-cnn.git
cd emotion-detection-cnn
```

**2. Install dependencies**
```bash
pip install tensorflow numpy pandas scikit-learn opencv-python matplotlib seaborn
```

**3. Add the data files**

Download the FER2013 dataset from Kaggle and run the preprocessing steps in data_prep.py to generate `pureX.npy`, `dataX.npy`, and `dataY.npy`.

**4. Train all models**
```bash
python model.py
```

This will train all 4 models, save the best checkpoints as `.h5` files, and save training plots.

## Key Results
- Human accuracy on FER2013: ~65%
- MLP (Pixels): baseline performance
- MLP (Landmarks): improved over raw pixels — geometric features capture more meaningful patterns
- CNN: further improvement by learning spatial features directly from images
- VGG16 Transfer Learning: best performance by leveraging features learned from 1M+ ImageNet images

## What I Learned
- How to build and train MLPs, CNNs, and transfer learning models in Keras
- Why convolutional networks outperform flat MLPs on image data
- The power of transfer learning — reusing pretrained weights dramatically improves accuracy
- How dropout and batch normalization help prevent overfitting
- How to compare multiple models and interpret confusion matrices

## Author
Pratyush Padhy — UCI CS Student  
[GitHub](https://github.com/Pratyushpad27) · [LinkedIn](https://www.linkedin.com/in/pratyush-padhy-b7017a269/)
