from flask import Flask, request, jsonify
import os
import numpy as np
import librosa
from pyAudioAnalysis import audioBasicIO
from pyAudioAnalysis import ShortTermFeatures
import pickle
import json

app = Flask(__name__)

@app.route("/")
def home():
    return "Audio Analyzer is running!"

# Load model & scaler & labels from models/
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'emotion_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'models', 'scaler.pkl')
LABELS_PATH = os.path.join(os.path.dirname(__file__), 'models', 'labels.json')

with open(MODEL_PATH, 'rb') as f:
    model = pickle.load(f)
with open(SCALER_PATH, 'rb') as f:
    scaler = pickle.load(f)
with open(LABELS_PATH, 'r') as f:
    labels = json.load(f)

def extract_features_for_model(file_path):
    [Fs, x] = audioBasicIO.read_audio_file(file_path)
    x = audioBasicIO.stereo_to_mono(x)
    F, f_names = ShortTermFeatures.feature_extraction(x, Fs, 0.025*Fs, 0.01*Fs)
    feature_vector = np.mean(F, axis=1)
    return feature_vector

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'no file provided'}), 400
    tmp_path = 'temp_audio.wav'
    file.save(tmp_path)
    try:
        y, sr = librosa.load(tmp_path, sr=None)
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        valid_pitches = pitches[pitches > 0]
        pitch = float(np.mean(valid_pitches)) if valid_pitches.size > 0 else 0.0
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        speed = float(tempo)
        feature_vector = extract_features_for_model(tmp_path)
        feature_vector_scaled = scaler.transform([feature_vector])
        pred = model.predict(feature_vector_scaled)[0]
        emotion = labels[int(pred)] if int(pred) < len(labels) else "Neutral"
        mood_map = {
            'Neutral': 'Neutral',
            'Happy': 'Happy',
            'Sad': 'Sad',
            'Angry': 'Angry',
            'Fear': 'Fear'
        }
        mood = mood_map.get(emotion, 'Neutral')
        return jsonify({
            'pitch': pitch,
            'speed': speed,
            'emotion': emotion,
            'mood': mood
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            os.remove(tmp_path)
        except:
            pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
