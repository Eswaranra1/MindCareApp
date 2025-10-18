import React from 'react';
import { View, Text } from 'react-native';
import { BarChart } from "react-native-chart-kit";
import CustomButton from '../components/CustomButton';

export default function ResultAnalysisScreen({ navigation }) {
  // Example data
  const chartData = {
    labels: ["Stress", "Depression", "Anxiety"],
    datasets: [{ data: [12, 8, 5] }],
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Result Analysis</Text>
      <BarChart
        data={chartData}
        width={340}
        height={220}
        yAxisLabel=""
        chartConfig={{
          backgroundColor: '#eee',
          backgroundGradientFrom: '#efefef',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(68, 187, 102, ${opacity})`,
          labelColor: () => '#444',
        }}
        style={{ marginVertical: 16 }}
      />
      <Text>Your stress level is moderate. Try deep breathing or a short walk.</Text>
      <CustomButton title="Back to Home" onPress={() => navigation.navigate('Home')} />
    </View>
  );
}
