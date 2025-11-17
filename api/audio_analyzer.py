from flask import Flask, request, jsonify
import os
import numpy as np
import librosa
from scipy.io import wavfile
import pickle
import json
import traceback
from pydub import AudioSegment

app = Flask(__name__)

@app.route("/")
def home():
    return "Audio Analyzer is running!"

# Load model & scaler & labels from models/
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'emotion_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'models', 'scaler.pkl')
LABELS_PATH = os.path.join(os.path.dirname(__file__), 'models', 'labels.json')

try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(SCALER_PATH, 'rb') as f:
        scaler = pickle.load(f)
    with open(LABELS_PATH, 'r') as f:
        labels = json.load(f)
    print("✓ Models loaded successfully")
    print(f"✓ Available emotions: {labels}")
except Exception as e:
    print(f"✗ Error loading models: {e}")
    model = None
    scaler = None
    labels = ["Neutral", "Happy", "Sad", "Angry", "Fear"]

def convert_to_wav(input_path, output_path):
    """Convert any audio format to WAV using pydub"""
    try:
        print(f"Converting {input_path} to WAV...")
        # Detect format from file
        audio = AudioSegment.from_file(input_path)
        # Export as WAV
        audio.export(output_path, format='wav')
        print(f"✓ Converted to WAV: {output_path}")
        return True
    except Exception as e:
        print(f"✗ Conversion error: {e}")
        traceback.print_exc()
        return False

def extract_features_for_model(file_path):
    """Extract audio features for ML model using librosa"""
    try:
        # Load audio with librosa (handles more formats)
        y, sr = librosa.load(file_path, sr=None, mono=True)
        
        # Check if audio is not empty
        if len(y) < sr * 0.1:  # At least 0.1 seconds
            print(f"Warning: Audio too short ({len(y)} samples, {len(y)/sr:.2f}s)")
            return None
        
        print(f"✓ Audio loaded: {len(y)} samples, {sr} Hz, {len(y)/sr:.2f}s duration")
        
        # Extract features using librosa (more reliable than pyAudioAnalysis)
        # MFCC features (commonly used for emotion recognition)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        
        # Spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
        zero_crossing_rate = librosa.feature.zero_crossing_rate(y)
        
        # Chroma features
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        
        # Combine all features and take mean
        feature_vector = np.hstack([
            np.mean(mfccs, axis=1),
            np.mean(spectral_centroids),
            np.mean(spectral_rolloff),
            np.mean(zero_crossing_rate),
            np.mean(chroma, axis=1)
        ])
        
        print(f"✓ Extracted {len(feature_vector)} features")
        return feature_vector
        
    except Exception as e:
        print(f"✗ Feature extraction error: {e}")
        traceback.print_exc()
        return None

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    if 'file' not in request.files:
        print("✗ No file in request")
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        print("✗ Empty filename")
        return jsonify({'error': 'Empty filename'}), 400

    # Create uploads directory
    upload_dir = 'uploads'
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save with original extension
    original_ext = os.path.splitext(file.filename)[1] or '.m4a'
    temp_input = os.path.join(upload_dir, f'temp_input{original_ext}')
    temp_wav = os.path.join(upload_dir, 'temp_audio.wav')
    
    try:
        # Save uploaded file
        file.save(temp_input)
        file_size = os.path.getsize(temp_input)
        print(f"✓ File received: {file.filename} ({file_size} bytes)")
        
        if file_size < 1000:  # Less than 1KB is suspicious
            return jsonify({'error': 'Audio file too small or corrupted'}), 400
        
        # Convert to WAV for processing
        if not convert_to_wav(temp_input, temp_wav):
            return jsonify({'error': 'Failed to convert audio format'}), 500
        
        # Extract pitch and tempo using librosa
        print("Analyzing pitch and tempo...")
        y, sr = librosa.load(temp_wav, sr=None, mono=True)
        
        # Pitch detection
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr, threshold=0.1)
        valid_pitches = pitches[pitches > 0]
        pitch = float(np.mean(valid_pitches)) if valid_pitches.size > 0 else 150.0
        
        # Tempo detection
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        speed = float(tempo) if isinstance(tempo, np.ndarray) else float(tempo)
        
        print(f"✓ Pitch: {pitch:.1f} Hz, Speed: {speed:.1f} BPM")
        
        # Extract features and predict emotion
        if model is not None and scaler is not None:
            print("Extracting features for emotion prediction...")
            feature_vector = extract_features_for_model(temp_wav)
            
            if feature_vector is not None:
                # Ensure feature vector has correct shape
                if len(feature_vector) < 34:
                    # Pad with zeros if needed
                    feature_vector = np.pad(feature_vector, (0, 34 - len(feature_vector)))
                elif len(feature_vector) > 34:
                    # Truncate if too long
                    feature_vector = feature_vector[:34]
                
                feature_vector_scaled = scaler.transform([feature_vector])
                pred = model.predict(feature_vector_scaled)[0]
                emotion = labels[int(pred)] if int(pred) < len(labels) else "Neutral"
                print(f"✓ Predicted emotion: {emotion}")
            else:
                emotion = "Neutral"
                print("⚠ Could not extract features, defaulting to Neutral")
        else:
            emotion = "Neutral"
            print("⚠ Model not loaded, defaulting to Neutral")
        
        # Map emotion to mood
        mood_map = {
            'Neutral': 'Neutral',
            'Happy': 'Happy',
            'Sad': 'Sad',
            'Angry': 'Angry',
            'Fear': 'Anxious',
            'Surprise': 'Surprised',
            'Disgust': 'Uncomfortable'
        }
        mood = mood_map.get(emotion, 'Neutral')
        
        response = {
            'pitch': round(pitch, 2),
            'speed': round(speed, 2),
            'emotion': emotion,
            'mood': mood
        }
        
        print(f"✓ Analysis complete: {response}")
        return jsonify(response)
        
    except Exception as e:
        error_msg = str(e)
        print(f"✗ Analysis error: {error_msg}")
        traceback.print_exc()
        return jsonify({'error': error_msg}), 500
        
    finally:
        # Cleanup temporary files
        try:
            if os.path.exists(temp_input):
                os.remove(temp_input)
            if os.path.exists(temp_wav):
                os.remove(temp_wav)
            print("✓ Temporary files cleaned up")
        except Exception as e:
            print(f"⚠ Cleanup warning: {e}")

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎤 Audio Analyzer Server Starting...")
    print("="*50)
    print(f"Models loaded: {model is not None}")
    print(f"Available emotions: {labels}")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5001, debug=True)