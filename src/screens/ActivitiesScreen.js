import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, ActivityIndicator } from 'react-native';
import CustomButton from '../components/CustomButton';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { BASE_URL } from '../utils/api';

export default function ActivitiesScreen({ route }) {
  const depression = route?.params?.depressionScore ?? 0;
  const anxiety = route?.params?.anxietyScore ?? 0;
  const stress = route?.params?.stressScore ?? 0;
  const mood = route?.params?.mood ?? "neutral";

  const [aiReco, setAiReco] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch new personalized recommendations every mount or when scores/mood change
  useEffect(() => {
    setLoading(true);
    axios.post(`${BASE_URL}/recommendations`, { depression, anxiety, stress, mood })
      .then(res => setAiReco(res.data))
      .catch(err => {
        setAiReco(null);
        console.error("AI Fetch error:", err?.response?.data ?? err.message);
      })
      .finally(() => setLoading(false));
  }, [depression, anxiety, stress, mood]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Personalized Activities & Recommendations</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : !aiReco ? (
        <Text style={styles.tipBox}>
          Failed to fetch dynamic recommendations. Please try again later.
        </Text>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Meditation or Breathing Videos</Text>
          {aiReco.meditations?.map((link, idx) => (
            <View key={`${link.url || ''}_${idx}`} style={styles.videoBox}>
              <Text style={styles.videoLabel}>{link.title}</Text>
              <WebView
                source={{ uri: link.url }}
                style={{ height: 185, borderRadius: 10, marginVertical: 6 }}
                javaScriptEnabled
                domStorageEnabled
                allowsFullscreenVideo
              />
            </View>
          ))}

          <Text style={styles.sectionTitle}>Music for Relaxation</Text>
          {aiReco.musics?.map((link, idx) => (
            <View key={`${link.url || ''}_${idx}`} style={styles.videoBox}>
              <Text style={styles.videoLabel}>{link.title}</Text>
              <WebView
                source={{ uri: link.url }}
                style={{ height: 185, borderRadius: 10, marginVertical: 6 }}
                javaScriptEnabled
                domStorageEnabled
                allowsFullscreenVideo
              />
            </View>
          ))}

          <Text style={styles.sectionTitle}>Motivational Quotes</Text>
          {aiReco.quotes?.map((q, idx) => (
            <Text key={`${q}_${idx}`} style={styles.quoteBox}>{q}</Text>
          ))}

          <Text style={styles.sectionTitle}>Affirmations</Text>
          {aiReco.affirmations?.map((a, idx) => (
            <Text key={`${a}_${idx}`} style={styles.affirmBox}>{a}</Text>
          ))}

          <Text style={styles.sectionTitle}>Personalized Tips</Text>
          {aiReco.tips?.map((tip, idx) => (
            <Text key={`${tip}_${idx}`} style={styles.tipBox}>{tip}</Text>
          ))}

          <CustomButton
            title="More YouTube Meditation"
            onPress={() => Linking.openURL('https://www.youtube.com/results?search_query=meditation+for+mental+health')}
            style={styles.btn}
          />
          <CustomButton
            title="More Motivation Quotes"
            onPress={() => Linking.openURL('https://www.goodreads.com/quotes/tag/motivation')}
            style={styles.btn}
          />
          <CustomButton
            title="More Affirmations"
            onPress={() => Linking.openURL('https://www.thegoodtrade.com/features/positive-affirmations-morning-routine/')}
            style={styles.btn}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4fafb' },
  header: { fontSize: 23, fontWeight: 'bold', color: '#044c87', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#2d6dfa', marginVertical: 10 },
  videoBox: { marginVertical: 8, backgroundColor: '#e3f2fd', borderRadius: 10, padding: 8 },
  videoLabel: { fontSize: 15, color: '#114488', fontWeight: '600', marginBottom: 3, marginLeft: 3 },
  quoteBox: { padding: 8, fontStyle: 'italic', color: '#2772ad', fontWeight: '500', backgroundColor: '#e9f7ee', marginVertical: 4, borderRadius: 8, textAlign: 'center' },
  tipBox: { padding: 9, borderRadius: 8, backgroundColor: '#fffbe6', color: '#8e44ad', marginBottom: 6, fontSize: 15, textAlign:'center' },
  affirmBox: { backgroundColor: '#e6f7ff', color:'#0e7490', padding:8, borderRadius:7, marginVertical:2, textAlign:'center', fontWeight:'600', fontSize:15 },
  btn: { backgroundColor: '#4f8ef7', marginVertical: 8 }
});
