import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import CustomButton from '../components/CustomButton';
import { BASE_URL } from "../utils/api";
import axios from 'axios';

const TEST_QUESTIONS = [
  { id: 1, question: 'In the past week, have you felt more sad or hopeless than usual?', scale: [0, 1, 2, 3] },
  { id: 2, question: 'Have you found it hard to relax or switch off your thoughts?', scale: [0, 1, 2, 3] },
  { id: 3, question: 'Have you felt anxious or restless?', scale: [0, 1, 2, 3] },
  { id: 4, question: 'Have you lost interest in things you used to enjoy?', scale: [0, 1, 2, 3] },
  { id: 5, question: 'Have you felt more irritable or angry than usual?', scale: [0, 1, 2, 3] },
  { id: 6, question: 'Have you found it hard to sleep or stay asleep?', scale: [0, 1, 2, 3] },
  { id: 7, question: 'Have you found tasks harder to concentrate on?', scale: [0, 1, 2, 3] }
  // Expand as needed for full DASS-21 style test
];

export default function MentalHealthTestScreen({ navigation, route }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAnswer = (qid, val) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  // Computes analysis based on answers
  const computeScores = () => {
    const depressionScore = (answers[1] || 0) + (answers[4] || 0) + (answers[7] || 0);
    const anxietyScore = (answers[2] || 0) + (answers[3] || 0) + (answers[6] || 0);
    const stressScore = (answers[5] || 0) + (answers[2] || 0);
    return { depressionScore, anxietyScore, stressScore };
  };

  const submitTest = async () => {
    if (Object.keys(answers).length !== TEST_QUESTIONS.length) {
      Alert.alert('Please answer every question.');
      return;
    }
    setLoading(true);
    const userEmail = route?.params?.email || 'demo@mindcare.com';
    const { depressionScore, anxietyScore, stressScore } = computeScores();

    try {
      await axios.post(`${BASE_URL}/mentalhealthresults`, {
        userEmail,
        answers,
        depressionScore,
        anxietyScore,
        stressScore
      });
      setLoading(false);
      navigation.navigate('ResultAnalysis', {
        depressionScore,
        anxietyScore,
        stressScore,
        userEmail
      });
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to save result');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mental Health Self-Assessment</Text>
      <FlatList
        data={TEST_QUESTIONS}
        keyExtractor={q => q.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.questionBlock}>
            <Text style={styles.questionText}>{item.question}</Text>
            <View style={styles.answersRow}>
              {item.scale.map(val => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.answerBtn, answers[item.id] === val && styles.answerActive
                  ]}
                  onPress={() => handleAnswer(item.id, val)}
                >
                  <Text style={styles.answerLabel}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />
      <CustomButton title="Submit Test" onPress={submitTest} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#044c87', textAlign: 'center' },
  questionBlock: { marginVertical: 10, padding: 12, backgroundColor: '#e4f1fb', borderRadius: 8 },
  questionText: { fontSize: 16, marginBottom: 8, color: '#114488' },
  answersRow: { flexDirection: 'row', justifyContent: 'space-between' },
  answerBtn: { padding: 12, borderRadius: 6, backgroundColor: '#ddd', marginHorizontal: 4 },
  answerActive: { backgroundColor: '#44bb66' },
  answerLabel: { color: '#044c87', fontWeight: 'bold' }
});
