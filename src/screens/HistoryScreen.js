import React from 'react';
import { View, Text } from 'react-native';
import { LineChart } from "react-native-chart-kit";

export default function HistoryScreen() {
  // Example chart data
  const chartData = {
    labels: ["Test1", "Test2", "Test3"],
    datasets: [{ data: [3, 2, 4] }],
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>History</Text>
      <LineChart
        data={chartData}
        width={340}
        height={220}
        chartConfig={{
          backgroundColor: '#eee',
          backgroundGradientFrom: '#efefef',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(68, 187, 102, ${opacity})`,
          labelColor: () => '#444',
        }}
        style={{ marginVertical: 24 }}
      />
      <Text>Motivational feedback messages here</Text>
    </View>
  );
}
