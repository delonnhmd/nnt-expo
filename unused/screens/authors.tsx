import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function AuthorsScreen() {
  const authors = [
    { name: 'Jane Doe', address: '0xjane' },
    { name: 'John Smith', address: '0xjohn' },
  ];
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Top Authors</Text>
      {authors.map((a) => (
        <View key={a.address} style={styles.row}>
          <Text style={styles.name}>{a.name}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push(`/user/${a.address}`)}>
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: 'white', gap: 10 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  name: { fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '700' },
});
