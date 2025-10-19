import React, { useState, useRef } from 'react';
import { View, Text, PermissionsAndroid, Platform, Alert, StyleSheet } from 'react-native';
import CustomButton from '../components/CustomButton';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

async function requestPermissions() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
      return (
        granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      return false;
    }
  }
  return true;
}

export default function VoiceDetectionScreen() {
  const [recording, setRecording] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [mood, setMood] = useState(null);

  // ✅ FIX: remove `new` — AudioRecorderPlayer is not a constructor
  const audioRecorderPlayer = useRef(AudioRecorderPlayer).current;

  const startRecording = async () => {
    const hasPerm = await requestPermissions();
    if (!hasPerm) {
      Alert.alert('Permission denied', 'Cannot record audio without permission');
      return;
    }
    try {
      setPitch(null);
      setSpeed(null);
      setMood(null);
      setRecording(true);

      await audioRecorderPlayer.startRecorder();
      audioRecorderPlayer.addRecordBackListener(() => {
        // Real-time recording info could go here
        return;
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);

      uploadToBackend(result);
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording');
      setRecording(false);
    }
  };

const uploadToBackend = async (audioFilePath) => {
  try {
    const file = {
      uri: audioFilePath,
      type: 'audio/mp4',
      name: 'voice.mp4',
    };

    let formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://YOUR_PC_IP:5001/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: formData,
    });

    const data = await response.json();

    setPitch(data.pitch);
    setSpeed(data.speed);
    setMood(data.emotion);

  } catch (error) {
    Alert.alert('Error', 'Failed to analyze audio');
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Detection</Text>
      <CustomButton
        title={recording ? 'Stop Recording' : 'Record Voice'}
        onPress={recording ? stopRecording : startRecording}
      />
      {pitch !== null && (
        <Text style={styles.infoText}>Pitch: {Math.round(pitch)} Hz</Text>
      )}
      {speed !== null && (
        <Text style={styles.infoText}>Speed: {speed.toFixed(2)} x</Text>
      )}
      {mood !== null && (
        <Text style={styles.infoText}>Mood: {mood}</Text>
      )}
      <Text style={styles.note}>
        Pitch, tone, and speed analysis will require advanced audio processing. For real mood/tone detection, integrate with a backend (Python librosa, etc.).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  infoText: { fontSize: 18, marginTop: 12, textAlign: 'center' },
  note: { marginTop: 24, color: '#666', fontSize: 14, textAlign: 'center' },
});
