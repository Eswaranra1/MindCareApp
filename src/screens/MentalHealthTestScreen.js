import React, { useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';

const TEST_QUESTIONS = [
  { id: 1, question: 'I found it hard to wind down', scale: [0,1,2,3] },
  // ...add more questions from DASS-21 or GSE
];

export default function MentalHealthTestScreen({ navigation }) {
  const [answers, setAnswers] = useState({});

  const handleAnswer = (qid, val) => {
    setAnswers(a => ({ ...a, [qid]: val }));
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Mental Health Test</Text>
      <FlatList
        data={TEST_QUESTIONS}
        keyExtractor={q => q.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 10 }}>
            <Text>{item.question}</Text>
            {item.scale.map(val => (
              <Button
                key={val}
                title={val.toString()}
                onPress={() => handleAnswer(item.id, val)}
                color={answers[item.id] === val ? '#44bb66' : '#bbb'}
              />
            ))}
          </View>
        )}
      />
      <CustomButton title="Submit" onPress={() => navigation.navigate('ResultAnalysis')} />
    </View>
  );
}
