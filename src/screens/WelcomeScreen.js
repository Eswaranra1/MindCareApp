import React from 'react';
import { View, Text, Image } from 'react-native';
import CustomButton from '../components/CustomButton';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#85c2ff' }}>
      <Image source={require('../../assets/logo.png')} style={{ width: 120, height: 120, marginBottom: 30 }} />
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#044c87' }}>Mind Care</Text>
      <CustomButton title="Login" onPress={() => navigation.navigate('Signup')} />
    </View>
  );
}
