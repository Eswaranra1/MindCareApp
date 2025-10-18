import React, { useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import CustomButton from '../components/CustomButton';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <TextInput placeholder="Email or Username" value={email} onChangeText={setEmail} style={{ borderBottomWidth: 1, marginBottom: 16 }} />
      <TextInput placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} style={{ borderBottomWidth: 1, marginBottom: 16 }} />
      <CustomButton title="Create Account" onPress={() => {/* handle signup */}} />
      <CustomButton title="Forgot Password?" onPress={() => {/* handle forgot */}} style={{ backgroundColor: '#bbb' }} />
    </View>
  );
}
