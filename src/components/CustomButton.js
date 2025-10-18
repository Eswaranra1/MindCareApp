import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function CustomButton({ title, onPress, style, loading }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.title}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    backgroundColor: '#44bb66',
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center'
  },
  title: { color: '#fff', fontSize: 17, fontWeight: 'bold' }
});
