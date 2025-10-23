import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../utils/api";
import { parseJwt } from '../utils/auth';
import axios from 'axios';

// Show last N entries in chart
const MAX_HISTORY = 7;

export default function HistoryScreen({ route }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userObj = parseJwt(token);
        const userEmail = userObj?.email;
        if (!userEmail) throw new Error("Session expired. Please log in again.");
        const res = await axios.get(`${BASE_URL}/mentalhealthresults/${userEmail}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (err) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Latest N results for graph, most recent first
  const chartHistory = history.slice(0, MAX_HISTORY).reverse();

  // Prepare labels and values for chart
  const chartLabels = chartHistory.map(
    h => (new Date(h.timestamp)).toLocaleDateString().replace(/\//g, '-')
  );
  const depressionData = chartHistory.map(h => h.depressionScore);
  const anxietyData = chartHistory.map(h => h.anxietyScore);
  const stressData = chartHistory.map(h => h.stressScore);

  function getTrendMessage() {
    // Simple feedback based on trend
    if (!history.length) return "";
    const avgDep = depressionData.reduce((a,b)=>a+b,0)/depressionData.length;
    const avgAnx = anxietyData.reduce((a,b)=>a+b,0)/anxietyData.length;
    const avgStr = stressData.reduce((a,b)=>a+b,0)/stressData.length;
    let msg = "";

    if (avgDep > 6) msg += "Your average depression score is high. Please consider professional support. ";
    else if (avgDep > 3) msg += "Mild depression trend; daily positive habits help. ";
    else msg += "Depression levels stable. ";

    if (avgAnx > 6) msg += "Anxiety scores are elevated, relax and seek help if needed. ";
    else if (avgAnx > 3) msg += "Notable anxiety, try breathing exercises. ";
    else msg += "Anxiety is well-managed. ";

    if (avgStr > 5) msg += "Stress levels high; take regular breaks. ";
    else if (avgStr > 2) msg += "Stress moderate; balance work and rest.";
    else msg += "Stress trend is stable.";
    return msg;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test History & Progress</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : history.length === 0 ? (
        <Text style={{ marginTop: 40, textAlign: 'center', color: '#888' }}>
          No history found. Take your first test!
        </Text>
      ) : (
        <>
          <Text style={styles.subtitle}>Depression, Anxiety, Stress Trends</Text>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                { data: depressionData, color: () => "#ef4444" }, // red
                { data: anxietyData, color: () => "#2563eb" }, // blue
                { data: stressData, color: () => "#10b981" } // green
              ],
              legend: ["Depression", "Anxiety", "Stress"],
            }}
            width={340}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#eef6fb",
              backgroundGradientFrom: "#eef6fb",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(68, 187, 102, ${opacity})`,
              labelColor: () => "#044c87",
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: "#444",
              },
              style: {
                borderRadius: 10,
              }
            }}
            bezier
            style={{ marginVertical: 24, borderRadius: 14 }}
          />
          <Text style={styles.trendMsg}>{getTrendMessage()}</Text>

          <Text style={styles.historyTitle}>All Past Results:</Text>
          {history.map((h, idx) => (
            <View key={idx} style={styles.historyItem}>
              <Text style={styles.dateText}>{(new Date(h.timestamp)).toLocaleString()}</Text>
              <View style={styles.scoresRow}>
                <Text style={styles.deprScore}>Depression: {h.depressionScore}</Text>
                <Text style={styles.anxScore}>Anxiety: {h.anxietyScore}</Text>
                <Text style={styles.strScore}>Stress: {h.stressScore}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fdfc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#044c87', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#115488', fontWeight: 'bold', marginVertical: 10 },
  historyTitle: { fontWeight: 'bold', fontSize: 16, color: '#114488', marginVertical: 12 },
  historyItem: { marginBottom: 8, padding: 10, backgroundColor: '#e0f7fa', borderRadius: 8 },
  scoresRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dateText: { fontSize: 15, color: '#228b22', fontWeight: '500', marginBottom: 2 },
  deprScore: { color: '#ef4444', fontWeight: 'bold', fontSize: 15 },
  anxScore: { color: '#2563eb', fontWeight: 'bold', fontSize: 15 },
  strScore: { color: '#10b981', fontWeight: 'bold', fontSize: 15 },
  trendMsg: { marginBottom: 20, marginTop: 6, color: '#2563eb', fontWeight: '600', fontSize: 16, textAlign: 'center' },
});
