import React from 'react';
import { View, Text } from 'react-native';
import CustomButton from '../components/CustomButton';

export default function VoiceDetectionScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Voice Detection</Text>
      <CustomButton title="Record Voice" onPress={() => {/* implement voice recording */}} />
      <Text style={{ marginTop: 16 }}>Analyze pitch, tone, speed, and output mood result.</Text>
      {/* Integration with audio analysis library recommended */}
    </View>
  );
}