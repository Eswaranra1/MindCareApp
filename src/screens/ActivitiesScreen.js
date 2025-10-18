import React from 'react';
import { View, Text } from 'react-native';
import CustomButton from '../components/CustomButton';

export default function ActivitiesScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Recommended Activities</Text>
      <Text>Meditation or breathing videos</Text>
      <Text>Motivational quotes or affirmations</Text>
      <Text>Music for relaxation</Text>
      <Text>Personalized tips based on user level</Text>
      <CustomButton title="Play Meditation Video" onPress={() => {/* Integrate video/audio player */}} />
    </View>
  );
}
