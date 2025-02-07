import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import HeaderComum from '../HeaderComum'
const MentorshipScreen = () => {
  const appointments = [
    { id: '1', mentor: 'João Silva', date: '2025-02-04', topic: 'Design UI/UX' },
    { id: '2', mentor: 'Maria Oliveira', date: '2025-02-05', topic: 'Desenvolvimento web' },
  ];

  return (
    <View style={styles.container}>
          <View style={styles.header}>
        <HeaderComum  screenName="Agendamentos de Mentoria"/>
                </View>
    

      <FlatList
        data={appointments}
        renderItem={({ item }) => (
          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentText}>{item.mentor}</Text>
            <Text style={styles.appointmentText}>{item.date}</Text>
            <Text style={styles.appointmentText}>{item.topic}</Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Ver Detalhes</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  appointmentCard: { padding: 15, marginVertical: 10, backgroundColor: '#ffffff', borderRadius: 10, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  appointmentText: { fontSize: 16, color: '#555' },
  button: { backgroundColor: '#2979FF', padding: 10, borderRadius: 5, marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  }
});

export default MentorshipScreen;
