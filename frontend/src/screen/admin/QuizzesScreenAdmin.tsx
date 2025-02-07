import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import HeaderComum from '../HeaderComum'
const QuizzesScreen = () => {
  const quizzes = [
    { id: '1', title: 'Quiz de Programação', date: '2025-02-04' },
    { id: '2', title: 'Quiz de JavaScript', date: '2025-02-03' },
  ];

  return (
    <View style={styles.container}>
         <View style={styles.header}>
        <HeaderComum  screenName="Gerenciar Quizzes"/>
                </View>
    
      <FlatList
        data={quizzes}
        renderItem={({ item }) => (
          <View style={styles.quizCard}>
            <Text style={styles.quizText}>{item.title}</Text>
            <Text style={styles.quizText}>{item.date}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Ver Resultados</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
       <TouchableOpacity style={styles.button2}>
                <Text style={styles.buttonText}>Adicionar</Text>
              </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  quizCard: { padding: 15, marginVertical: 10, backgroundColor: '#ffffff', borderRadius: 10, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  quizText: { fontSize: 16, color: '#555' },
  actions: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-around' },
  button: { backgroundColor: '#2979FF', padding: 10, borderRadius: 5 },
  button2: { backgroundColor: '#2979FF', padding: 10, borderRadius: 5,width:90 ,marginLeft:900},
  buttonText: { color: '#fff', fontWeight: 'bold' },  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  }
});

export default QuizzesScreen;
