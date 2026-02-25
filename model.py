"""
Emotion Detection using Neural Networks & CNNs
================================================
Detects 5 emotions from facial images using:
  - MLP on raw pixel inputs
  - MLP on facial landmark distances
  - CNN
  - Transfer Learning (VGG16)

Dataset: FER2013 (Facial Expression Recognition)
"""

import numpy as np
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix

import matplotlib.pyplot as plt
import seaborn as sns

import matplotlib
matplotlib.use('Agg')

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (Dense, Dropout, Conv2D, MaxPooling2D,
                                     Flatten, BatchNormalization, GlobalAveragePooling2D)
from tensorflow.keras.losses import categorical_crossentropy
from tensorflow.keras.optimizers import SGD, Adam
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import ModelCheckpoint
from tensorflow.keras.applications import VGG16

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

EPOCHS = 20
BATCH_SIZE = 64
TEST_RATIO = 0.1
N_LABELS = 5
IMG_WIDTH, IMG_HEIGHT = 48, 48

EMOTION_LABELS = ['Angry', 'Fear', 'Happy', 'Sad', 'Surprise']


# ─────────────────────────────────────────────
# DATA LOADING
# ─────────────────────────────────────────────

def load_data():
    """
    Load pixel data and landmark distance data from .npy files.
    Returns pixel features, landmark features, and one-hot labels.
    """
    dataX_pixels = np.load('pureX.npy')     # raw pixel inputs (48x48 flattened)
    dataX_landmarks = np.load('dataX.npy')  # facial landmark distances
    dataY_labels = np.load('dataY.npy')     # emotion labels

    # One-hot encode labels
    y_onehot = to_categorical(dataY_labels, len(set(dataY_labels)))

    return dataX_pixels, dataX_landmarks, y_onehot


def preprocess_data(dataX_pixels, dataX_landmarks, y_onehot):
    """
    Split into train/test sets and standardize both feature types.
    """
    # Pixel data split
    X_train, X_test, y_train, y_test = train_test_split(
        dataX_pixels, y_onehot, test_size=TEST_RATIO, random_state=42
    )
    pixel_scaler = StandardScaler()
    X_train = pixel_scaler.fit_transform(X_train)
    X_test = pixel_scaler.transform(X_test)

    # Landmark data split
    X_train_lm, X_test_lm, y_train_lm, y_test_lm = train_test_split(
        dataX_landmarks, y_onehot, test_size=TEST_RATIO, random_state=42
    )
    lm_scaler = StandardScaler()
    X_train_lm = lm_scaler.fit_transform(X_train_lm)
    X_test_lm = lm_scaler.transform(X_test_lm)

    return (X_train, X_test, y_train, y_test,
            X_train_lm, X_test_lm, y_train_lm, y_test_lm)


def reshape_for_cnn(X_train, X_test):
    """Reshape flat pixel arrays into (N, 48, 48, 1) for CNN input."""
    X_train_cnn = np.expand_dims(X_train.reshape(len(X_train), IMG_HEIGHT, IMG_WIDTH), 3)
    X_test_cnn = np.expand_dims(X_test.reshape(len(X_test), IMG_HEIGHT, IMG_WIDTH), 3)
    return X_train_cnn, X_test_cnn


# ─────────────────────────────────────────────
# MODEL DEFINITIONS
# ─────────────────────────────────────────────

def build_mlp(input_shape):
    """
    Multi-Layer Perceptron with 3 dense layers + dropout.
    Works on both pixel and landmark inputs.
    """
    model = Sequential([
        Dense(1024, input_shape=(input_shape,), activation='relu',
              kernel_initializer='glorot_normal'),
        Dropout(0.5),
        Dense(512, activation='relu', kernel_initializer='glorot_normal'),
        Dense(N_LABELS, activation='softmax')
    ])
    model.compile(
        loss=categorical_crossentropy,
        optimizer=SGD(learning_rate=0.001),
        metrics=['accuracy']
    )
    return model


def build_cnn():
    """
    Convolutional Neural Network for image-based emotion detection.
    Input: (48, 48, 1) grayscale face images.
    """
    model = Sequential([
        Conv2D(64, kernel_size=(3, 3), activation='relu',
               input_shape=(IMG_WIDTH, IMG_HEIGHT, 1)),
        BatchNormalization(),
        Conv2D(64, kernel_size=(3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        MaxPooling2D(pool_size=(2, 2), strides=(2, 2)),
        Dropout(0.5),

        Conv2D(128, kernel_size=(3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        Conv2D(128, kernel_size=(3, 3), activation='relu', padding='same'),
        BatchNormalization(),
        MaxPooling2D(pool_size=(2, 2), strides=(2, 2)),
        Dropout(0.5),

        Flatten(),
        Dense(1024, activation='relu'),
        Dropout(0.5),
        Dense(N_LABELS, activation='softmax')
    ])
    model.compile(
        loss=categorical_crossentropy,
        optimizer=Adam(learning_rate=0.001),
        metrics=['accuracy']
    )
    return model


def build_vgg_transfer():
    """
    Transfer learning using VGG16 pretrained on ImageNet.
    Top layers replaced for 5-class emotion classification.
    """
    # VGG16 expects RGB (3-channel) images, so we resize
    base_model = VGG16(weights='imagenet', include_top=False,
                       input_shape=(48, 48, 3))
    base_model.trainable = False  # freeze pretrained weights

    model = Sequential([
        base_model,
        GlobalAveragePooling2D(),
        Dense(256, activation='relu'),
        Dropout(0.5),
        Dense(N_LABELS, activation='softmax')
    ])
    model.compile(
        loss=categorical_crossentropy,
        optimizer=Adam(learning_rate=0.0001),
        metrics=['accuracy']
    )
    return model


# ─────────────────────────────────────────────
# TRAINING
# ─────────────────────────────────────────────

def train_model(model, X_train, y_train, X_test, y_test, checkpoint_name):
    """Train a model and save the best checkpoint."""
    checkpoint = ModelCheckpoint(
        checkpoint_name, monitor='val_accuracy',
        save_best_only=True, mode='auto', verbose=1
    )
    history = model.fit(
        X_train, y_train,
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(X_test, y_test),
        callbacks=[checkpoint]
    )
    return history


# ─────────────────────────────────────────────
# EVALUATION & VISUALIZATION
# ─────────────────────────────────────────────

def plot_training(history, title='Model Training'):
    """Plot accuracy and loss curves over training epochs."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

    ax1.plot(history.history['accuracy'], label='Train')
    ax1.plot(history.history['val_accuracy'], label='Validation')
    ax1.set_title(f'{title} - Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()

    ax2.plot(history.history['loss'], label='Train')
    ax2.plot(history.history['val_loss'], label='Validation')
    ax2.set_title(f'{title} - Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()

    plt.tight_layout()
    plt.savefig(f'{title.lower().replace(" ", "_")}_training.png')
    plt.show()


def plot_confusion_matrix(model, X_test, y_test, title='Confusion Matrix'):
    """Generate and plot a confusion matrix for model predictions."""
    y_pred = np.argmax(model.predict(X_test), axis=1)
    y_true = np.argmax(y_test, axis=1)

    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=EMOTION_LABELS, yticklabels=EMOTION_LABELS)
    plt.title(title)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(f'{title.lower().replace(" ", "_")}.png')
    plt.show()

    accuracy = np.mean(y_pred == y_true)
    print(f'{title} Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)')
    return accuracy


def compare_models(histories, labels):
    """Plot validation accuracy of all models on one graph."""
    plt.figure(figsize=(10, 5))
    for history, label in zip(histories, labels):
        plt.plot(history.history['val_accuracy'], label=label)
    plt.title('Model Comparison — Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Validation Accuracy')
    plt.legend()
    plt.tight_layout()
    plt.savefig('model_comparison.png')
    plt.show()


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == '__main__':
    print("Loading data...")
    dataX_pixels, dataX_landmarks, y_onehot = load_data()

    print("Preprocessing data...")
    (X_train, X_test, y_train, y_test,
     X_train_lm, X_test_lm, y_train_lm, y_test_lm) = preprocess_data(
        dataX_pixels, dataX_landmarks, y_onehot
    )

    # --- Model 1: MLP on pixel inputs ---
    print("\n--- Training MLP (Pixel Inputs) ---")
    mlp_model = build_mlp(X_train.shape[1])
    mlp_history = train_model(mlp_model, X_train, y_train,
                               X_test, y_test, 'best_mlp_model.h5')
    plot_training(mlp_history, 'MLP Pixel')
    plot_confusion_matrix(mlp_model, X_test, y_test, 'MLP Pixel Confusion Matrix')

    # --- Model 2: MLP on landmark distance inputs ---
    print("\n--- Training MLP (Landmark Inputs) ---")
    lm_model = build_mlp(X_train_lm.shape[1])
    lm_history = train_model(lm_model, X_train_lm, y_train_lm,
                              X_test_lm, y_test_lm, 'best_lm_model.h5')
    plot_training(lm_history, 'MLP Landmarks')
    plot_confusion_matrix(lm_model, X_test_lm, y_test_lm, 'MLP Landmark Confusion Matrix')

    # --- Model 3: CNN ---
    print("\n--- Training CNN ---")
    X_train_cnn, X_test_cnn = reshape_for_cnn(X_train, X_test)
    cnn_model = build_cnn()
    cnn_history = train_model(cnn_model, X_train_cnn, y_train,
                               X_test_cnn, y_test, 'best_cnn_model.h5')
    plot_training(cnn_history, 'CNN')
    plot_confusion_matrix(cnn_model, X_test_cnn, y_test, 'CNN Confusion Matrix')

    # --- Model 4: Transfer Learning (VGG16) ---
    print("\n--- Training VGG16 Transfer Learning ---")
    # VGG16 needs 3-channel images
    X_train_vgg = np.repeat(X_train_cnn, 3, axis=3)
    X_test_vgg = np.repeat(X_test_cnn, 3, axis=3)
    vgg_model = build_vgg_transfer()
    vgg_history = train_model(vgg_model, X_train_vgg, y_train,
                               X_test_vgg, y_test, 'best_vgg_model.h5')
    plot_training(vgg_history, 'VGG16 Transfer Learning')
    plot_confusion_matrix(vgg_model, X_test_vgg, y_test, 'VGG16 Confusion Matrix')

    # --- Compare all models ---
    print("\n--- Comparing All Models ---")
    compare_models(
        [mlp_history, lm_history, cnn_history, vgg_history],
        ['MLP Pixels', 'MLP Landmarks', 'CNN', 'VGG16']
    )

    print("\nDone! Model checkpoints and plots saved.")
