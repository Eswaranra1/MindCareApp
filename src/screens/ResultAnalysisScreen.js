import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart } from "react-native-chart-kit";
import CustomButton from '../components/CustomButton';
import { BASE_URL } from "../utils/api";
import axios from 'axios';

export default function ResultAnalysisScreen({ navigation, route }) {
  const { depressionScore, anxietyScore, stressScore, userEmail } = route?.params || {};
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get(`${BASE_URL}/mentalhealthresults/${userEmail}`)
      .then(res => setHistory(res.data))
      .catch(() => {});
  }, []);

  const latest = { depressionScore, anxietyScore, stressScore };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Mental Health Analysis</Text>
      <BarChart
        data={{
          labels: ["Depression", "Anxiety", "Stress"],
          datasets: [{ data: [latest.depressionScore, latest.anxietyScore, latest.stressScore] }]
        }}
        width={340}
        height={220}
        yAxisLabel=""
        chartConfig={{
          backgroundGradientFrom: '#dbeafe',
          backgroundGradientTo: '#bbf7d0',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(68, 187, 102, ${opacity})`,
          labelColor: () => '#044c87',
        }}
        style={{ marginVertical: 16, borderRadius: 14 }}
      />
      <Text style={styles.resultMsg}>
        {latest.depressionScore > 6
          ? 'Your depression score suggests you may benefit from support. Consider talking to a professional.'
          : latest.depressionScore > 3
          ? 'Mild signs of low mood; taking regular breaks and positive self-talk may help.'
          : 'No major indications of depression.'}
      </Text>
      <Text style={styles.resultMsg}>
        {latest.anxietyScore > 6
          ? 'High anxiety detected. Try breathing exercises or seek support.'
          : latest.anxietyScore > 3
          ? 'Mild anxiety; relaxation techniques are recommended.'
          : 'Low anxiety response.'}
      </Text>
      <Text style={styles.resultMsg}>
        {latest.stressScore > 4
          ? 'Elevated stress levels noticed. Try short walks and mindfulness breaks.'
          : latest.stressScore > 2
          ? 'Moderate stress; check your daily workload.'
          : 'Low stress level.'}
      </Text>
      <Text style={styles.subtitle}>Your Previous Results:</Text>
      {history.map((h, idx) => (
        <View key={idx} style={styles.historyBlock}>
          <Text>{(new Date(h.timestamp)).toLocaleString()}</Text>
          <Text>Depression: {h.depressionScore}, Anxiety: {h.anxietyScore}, Stress: {h.stressScore}</Text>
        </View>
      ))}
      <CustomButton title="Back to Home" onPress={() => navigation.navigate('Home')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fdfc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#044c87', marginBottom: 10, textAlign: 'center' },
  resultMsg: { fontSize: 15, color: '#114488', marginBottom: 10 },
  subtitle: { fontWeight: 'bold', marginTop: 20, fontSize: 16, color: '#114488' },
  historyBlock: { marginBottom: 8, padding: 10, backgroundColor: '#e0f7fa', borderRadius: 8 }
});
