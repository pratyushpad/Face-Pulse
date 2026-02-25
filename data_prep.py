import os
import subprocess

def setup_project():
    files = {
        "pureX.npy": "https://storage.googleapis.com/inspirit-ai-data-bucket-1/Data/AI%20Scholars/Sessions%206%20-%2010%20(Projects)/Project%20-%20Emotion%20Detection/pureX.npy",
        "dataX.npy": "https://storage.googleapis.com/inspirit-ai-data-bucket-1/Data/AI%20Scholars/Sessions%206%20-%2010%20(Projects)/Project%20-%20Emotion%20Detection/dataX_edited.npy",
        "dataY.npy": "https://storage.googleapis.com/inspirit-ai-data-bucket-1/Data/AI%20Scholars/Sessions%206%20-%2010%20(Projects)/Project%20-%20Emotion%20Detection/dataY.npy",
        "shape_predictor_68_face_landmarks.dat": "https://storage.googleapis.com/inspirit-ai-data-bucket-1/Data/AI%20Scholars/Sessions%206%20-%2010%20(Projects)/Project%20-%20Emotion%20Detection/shape_predictor_68_face_landmarks.dat"
    }

    print("--- Starting Environment Setup ---")
    for filename, url in files.items():
        if not os.path.exists(filename):
            print(f"Downloading {filename}...")
            subprocess.run(["curl", "-L", "-o", filename, url])
        else:
            print(f"Check: {filename} already exists.")
    
    print("--- Setup Complete! You are ready to train. ---")

if __name__ == "__main__":
    setup_project()