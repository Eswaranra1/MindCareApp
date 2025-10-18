import React, { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import CustomButton from '../components/CustomButton';
import { signUp, login, forgotPassword } from '../utils/api';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      const res = await signUp(email, password);
      Alert.alert(res.data.message);
      navigation.navigate('Home');
    } catch (err) {
      Alert.alert('Signup error', err?.response?.data?.error || 'Unknown error');
    }
  };

  const handleLogin = async () => {
    try {
      const res = await login(email, password);
      Alert.alert(res.data.message);
      navigation.navigate('Home');
    } catch (err) {
      Alert.alert('Login error', err?.response?.data?.error || 'Unknown error');
    }
  };

  const handleForgot = async () => {
    try {
      const res = await forgotPassword(email);
      Alert.alert(res.data.message || "Check your email for reset link.");
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || 'Unknown error');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <TextInput placeholder="Email or Username" value={email} onChangeText={setEmail} style={{ borderBottomWidth: 1, marginBottom: 16 }} />
      <TextInput placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} style={{ borderBottomWidth: 1, marginBottom: 16 }} />
      <CustomButton title="Create Account" onPress={handleSignup} />
      <CustomButton title="Login" onPress={handleLogin} style={{ backgroundColor: '#44bb66' }} />
      <CustomButton title="Forgot Password?" onPress={handleForgot} style={{ backgroundColor: '#bbb' }} />
    </View>
  );
}
