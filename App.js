import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './src/screens/WelcomeScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import MentalHealthTestScreen from './src/screens/MentalHealthTestScreen';
import VoiceDetectionScreen from './src/screens/VoiceDetectionScreen';
import ResultAnalysisScreen from './src/screens/ResultAnalysisScreen';
import ActivitiesScreen from './src/screens/ActivitiesScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MentalHealthTest" component={MentalHealthTestScreen} />
        <Stack.Screen name="VoiceDetection" component={VoiceDetectionScreen} />
        <Stack.Screen name="ResultAnalysis" component={ResultAnalysisScreen} />
        <Stack.Screen name="Activities" component={ActivitiesScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
