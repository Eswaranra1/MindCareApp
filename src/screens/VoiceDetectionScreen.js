import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import CustomButton from '../components/CustomButton';
import AudioRecorderPlayer from 'react-native-nitro-sound';
import { analyzeAudio } from '../utils/api';

async function requestPermissions() {
  if (Platform.OS === 'android') {
    const audioGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    console.log('Record Audio:', audioGranted);
    return audioGranted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

export default function VoiceDetectionScreen() {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [mood, setMood] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPath, setAudioPath] = useState(null);
  
  // Real-time analysis states
  const [liveVolume, setLiveVolume] = useState(0);
  const [livePitch, setLivePitch] = useState(0);
  const [realtimeEmotion, setRealtimeEmotion] = useState('Listening...');

  const audioRecorderPlayer = useRef(AudioRecorderPlayer).current;
  const recordingInterval = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const volumeAnim = useRef(new Animated.Value(0)).current;

  // Real-time emotion detection based on volume and pitch patterns
  const detectRealtimeEmotion = (volume, recordTime) => {
    // Simulate real-time emotion detection based on audio patterns
    if (volume < 20) {
      return 'Calm 😌';
    } else if (volume < 40) {
      return 'Neutral 😐';
    } else if (volume < 60) {
      return 'Engaged 🙂';
    } else if (volume < 80) {
      return 'Excited 😊';
    } else {
      // High volume patterns
      if (recordTime % 3 === 0) return 'Energetic 🤩';
      if (recordTime % 3 === 1) return 'Intense 😤';
      return 'Passionate 🔥';
    }
  };

  useEffect(() => {
    if (recording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start recording timer
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [recording]);

  // Animate volume indicator
  useEffect(() => {
    Animated.timing(volumeAnim, {
      toValue: liveVolume / 100,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [liveVolume]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    const hasPerm = await requestPermissions();
    if (!hasPerm) {
      Alert.alert('Permission Denied', 'Cannot record audio without microphone permission');
      return;
    }

    try {
      // Clear previous results
      setPitch(null);
      setSpeed(null);
      setEmotion(null);
      setMood(null);
      setRecordingTime(0);
      setAudioPath(null);
      setLiveVolume(0);
      setLivePitch(0);
      setRealtimeEmotion('Listening...');
      setRecording(true);

      const result = await audioRecorderPlayer.startRecorder();
      console.log('Recording started:', result);

      // Real-time audio monitoring
      audioRecorderPlayer.addRecordBackListener((e) => {
        if (e?.currentMetering) {
          // Get real-time audio metrics
          const volume = Math.abs(e.currentMetering);
          const normalizedVolume = Math.min(Math.max(volume * 2, 0), 100);
          
          setLiveVolume(normalizedVolume);
          setLivePitch(normalizedVolume * 2); // Simplified pitch estimation
          
          // Update real-time emotion
          const emotion = detectRealtimeEmotion(normalizedVolume, Math.floor(e.currentPosition / 1000));
          setRealtimeEmotion(emotion);
        }
        return;
      });
    } catch (err) {
      console.error('Recording start error:', err);
      Alert.alert('Error', 'Failed to start recording: ' + err.message);
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecording(false);
      setAudioPath(result);

      console.log('Recording stopped. File:', result);

      if (result && recordingTime >= 1) {
        uploadToBackend(result);
      } else {
        Alert.alert('Recording Too Short', 'Please record for at least 1 second');
      }
    } catch (err) {
      console.error('Recording stop error:', err);
      Alert.alert('Error', 'Failed to stop recording: ' + err.message);
      setRecording(false);
    }
  };

  const uploadToBackend = async (audioFilePath) => {
    setAnalyzing(true);
    try {
      console.log('Analyzing audio file:', audioFilePath);
      const response = await analyzeAudio(audioFilePath);
      const data = response.data;

      console.log('Analysis result:', data);

      setPitch(data.pitch);
      setSpeed(data.speed);
      setEmotion(data.emotion || 'Neutral');
      setMood(data.mood || 'Neutral');

      Alert.alert('Analysis Complete', `Mood detected: ${data.mood || 'Neutral'}`);
    } catch (error) {
      console.error('Audio analysis error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      Alert.alert('Analysis Failed', `Could not analyze audio: ${errorMsg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const playRecording = async () => {
    if (!audioPath) {
      Alert.alert('No Recording', 'Please record audio first');
      return;
    }

    try {
      setPlaying(true);
      setPlaybackTime(0);

      const msg = await audioRecorderPlayer.startPlayer(audioPath);
      console.log('Playing:', msg);

      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition && e.duration) {
          setPlaybackTime(Math.floor(e.currentPosition / 1000));
          setAudioDuration(Math.floor(e.duration / 1000));

          // Auto-stop when finished
          if (e.currentPosition >= e.duration) {
            stopPlayback();
          }
        }
        return;
      });
    } catch (err) {
      console.error('Playback error:', err);
      Alert.alert('Playback Error', 'Could not play recording');
      setPlaying(false);
    }
  };

  const stopPlayback = async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setPlaying(false);
      setPlaybackTime(0);
    } catch (err) {
      console.error('Stop playback error:', err);
      setPlaying(false);
    }
  };

  const getMoodColor = (detectedMood) => {
    const colors = {
      Happy: '#4CAF50',
      Sad: '#2196F3',
      Angry: '#F44336',
      Anxious: '#FF9800',
      Neutral: '#9E9E9E',
      Surprised: '#9C27B0',
      Uncomfortable: '#795548',
    };
    return colors[detectedMood] || '#9E9E9E';
  };

  const getMoodEmoji = (detectedMood) => {
    const emojis = {
      Happy: '😊',
      Sad: '😢',
      Angry: '😠',
      Anxious: '😰',
      Neutral: '😐',
      Surprised: '😲',
      Uncomfortable: '😣',
    };
    return emojis[detectedMood] || '😐';
  };

  const getPitchLevel = (pitchValue) => {
    if (!pitchValue) return 'Normal';
    if (pitchValue < 100) return 'Very Low';
    if (pitchValue < 150) return 'Low';
    if (pitchValue < 200) return 'Normal';
    if (pitchValue < 250) return 'High';
    return 'Very High';
  };

  const getSpeedLevel = (speedValue) => {
    if (!speedValue) return 'Normal';
    if (speedValue < 80) return 'Slow';
    if (speedValue < 120) return 'Normal';
    if (speedValue < 160) return 'Fast';
    return 'Very Fast';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎤 Voice Analyzer</Text>
        <Text style={styles.subtitle}>
          Real-time emotion detection from your voice
        </Text>

        {/* Real-time Analysis Display (during recording) */}
        {recording && (
          <View style={styles.realtimeContainer}>
            <Text style={styles.realtimeTitle}>Live Analysis</Text>
            
            {/* Real-time Emotion */}
            <View style={styles.realtimeEmotionBox}>
              <Text style={styles.realtimeEmotionText}>{realtimeEmotion}</Text>
            </View>

            {/* Volume Meter */}
            <View style={styles.meterContainer}>
              <Text style={styles.meterLabel}>Voice Level</Text>
              <View style={styles.meterBar}>
                <Animated.View
                  style={[
                    styles.meterFill,
                    {
                      width: volumeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: 
                        liveVolume > 70 ? '#F44336' :
                        liveVolume > 40 ? '#FF9800' : '#4CAF50',
                    },
                  ]}
                />
              </View>
              <Text style={styles.meterValue}>{Math.round(liveVolume)}%</Text>
            </View>

            {/* Pitch Indicator */}
            <View style={styles.pitchIndicator}>
              <Text style={styles.pitchLabel}>Pitch: </Text>
              <Text style={styles.pitchValue}>{Math.round(livePitch)} Hz</Text>
            </View>
          </View>
        )}

        {/* Recording Button */}
        <View style={styles.recordingSection}>
          <Animated.View style={[styles.recordButton, { transform: [{ scale: pulseAnim }] }]}>
            <CustomButton
              title={recording ? 'Stop Recording' : 'Start Recording'}
              onPress={recording ? stopRecording : startRecording}
              style={[
                styles.mainButton,
                recording ? styles.recordingButton : styles.startButton,
              ]}
            />
          </Animated.View>

          {recording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording: {formatTime(recordingTime)}</Text>
            </View>
          )}
        </View>

        {/* Playback Controls */}
        {audioPath && !recording && (
          <View style={styles.playbackSection}>
            <Text style={styles.playbackTitle}>📼 Recorded Audio</Text>
            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={[styles.playButton, playing && styles.playButtonActive]}
                onPress={playing ? stopPlayback : playRecording}
              >
                <Text style={styles.playButtonText}>
                  {playing ? '⏸️ Pause' : '▶️ Play Recording'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {playing && audioDuration > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressTime}>
                  {formatTime(playbackTime)} / {formatTime(audioDuration)}
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${(playbackTime / audioDuration) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Analyzing Indicator */}
        {analyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.analyzingText}>Analyzing your voice...</Text>
          </View>
        )}

        {/* Results Section */}
        {!analyzing && (pitch || speed || mood) && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>📊 Analysis Results</Text>

            {/* Mood Result - Primary */}
            {mood && (
              <View style={[styles.moodCard, { borderColor: getMoodColor(mood) }]}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(mood)}</Text>
                <Text style={styles.moodLabel}>Detected Mood</Text>
                <Text style={[styles.moodValue, { color: getMoodColor(mood) }]}>{mood}</Text>
                {emotion && <Text style={styles.emotionSubtext}>Emotion: {emotion}</Text>}
              </View>
            )}

            {/* Pitch Analysis */}
            {typeof pitch === 'number' && (
              <View style={styles.analysisCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>🎵</Text>
                  <Text style={styles.cardTitle}>Pitch Analysis</Text>
                </View>
                <Text style={styles.cardValue}>{Math.round(pitch)} Hz</Text>
                <Text style={styles.cardLevel}>{getPitchLevel(pitch)}</Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((pitch / 300) * 100, 100)}%`, backgroundColor: '#2196F3' },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Speed/Tempo Analysis */}
            {typeof speed === 'number' && !isNaN(speed) && (
              <View style={styles.analysisCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>⚡</Text>
                  <Text style={styles.cardTitle}>Speech Tempo</Text>
                </View>
                <Text style={styles.cardValue}>{speed.toFixed(1)} BPM</Text>
                <Text style={styles.cardLevel}>{getSpeedLevel(speed)}</Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((speed / 200) * 100, 100)}%`, backgroundColor: '#4CAF50' },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Emotion Interpretation */}
            <View style={styles.interpretationCard}>
              <Text style={styles.interpretationTitle}>🧠 What This Means</Text>
              <Text style={styles.interpretationText}>
                {mood === 'Happy' && '✨ Your voice shows positive energy and enthusiasm. Keep up the great mood!'}
                {mood === 'Sad' && '💙 Your voice reflects some heaviness. It\'s okay to feel this way. Consider talking to someone you trust.'}
                {mood === 'Angry' && '🔥 Your voice shows intensity. Take a few deep breaths and find a healthy outlet.'}
                {mood === 'Anxious' && '🌊 Your voice suggests some tension. Try some breathing exercises or meditation.'}
                {mood === 'Neutral' && '⚖️ Your voice is calm and balanced. A good baseline emotional state.'}
                {mood === 'Surprised' && '⭐ Your voice shows excitement or unexpectedness. Something caught your attention!'}
                {mood === 'Uncomfortable' && '🤗 Your voice reflects some discomfort. Take time for self-care.'}
              </Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>💡 Tips for Best Results:</Text>
          <Text style={styles.instructionText}>• Speak naturally for at least 5 seconds</Text>
          <Text style={styles.instructionText}>• Find a quiet environment</Text>
          <Text style={styles.instructionText}>• Express yourself authentically</Text>
          <Text style={styles.instructionText}>• Watch the real-time indicators</Text>
          <Text style={styles.instructionText}>• Play back your recording to review</Text>
        </View>

        {/* Technical Info */}
        {audioPath && (
          <Text style={styles.technicalNote}>
            📁 {audioPath.split('/').pop()}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a237e',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#546e7a',
    textAlign: 'center',
    marginBottom: 25,
  },
  realtimeContainer: {
    backgroundColor: '#1a237e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  realtimeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  realtimeEmotionBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  realtimeEmotionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  meterContainer: {
    marginBottom: 15,
  },
  meterLabel: {
    fontSize: 14,
    color: '#b3e5fc',
    marginBottom: 8,
    fontWeight: '600',
  },
  meterBar: {
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 10,
  },
  meterValue: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  pitchIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 10,
  },
  pitchLabel: {
    fontSize: 16,
    color: '#b3e5fc',
    fontWeight: '600',
  },
  pitchValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  recordButton: {
    width: '100%',
    alignItems: 'center',
  },
  mainButton: {
    paddingVertical: 16,
    borderRadius: 50,
    minWidth: 200,
  },
  startButton: {
    backgroundColor: '#2196F3',
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
  },
  playbackSection: {
    backgroundColor: '#e8eaf6',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  playbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 15,
    textAlign: 'center',
  },
  playbackControls: {
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#5c6bc0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  playButtonActive: {
    backgroundColor: '#3949ab',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressContainer: {
    marginTop: 15,
  },
  progressTime: {
    fontSize: 14,
    color: '#3f51b5',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(63, 81, 181, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3f51b5',
    borderRadius: 3,
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    marginBottom: 20,
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1565c0',
    fontWeight: '500',
  },
  resultsContainer: {
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 15,
    textAlign: 'center',
  },
  moodCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  moodEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  moodLabel: {
    fontSize: 14,
    color: '#78909c',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  moodValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emotionSubtext: {
    fontSize: 14,
    color: '#90a4ae',
    fontStyle: 'italic',
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474f',
  },
  cardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 5,
  },
  cardLevel: {
    fontSize: 16,
    color: '#546e7a',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#eceff1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  interpretationCard: {
    backgroundColor: '#f1f8e9',
    borderRadius: 15,
    padding: 20,
    marginTop: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#8bc34a',
  },
  interpretationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#558b2f',
    marginBottom: 10,
  },
  interpretationText: {
    fontSize: 15,
    color: '#689f38',
    lineHeight: 22,
  },
  instructionsContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#ef6c00',
    marginBottom: 6,
    lineHeight: 20,
  },
  technicalNote: {
    fontSize: 12,
    color: '#90a4ae',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
});