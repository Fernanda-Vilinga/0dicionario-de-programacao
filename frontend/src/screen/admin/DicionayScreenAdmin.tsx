import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import HeaderComum from '../HeaderComum'
const DictionaryScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderComum  screenName="Gerenciar Dicionário"/>
                </View>
     

      <TextInput style={styles.input} placeholder="Adicionar novo termo" />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Adicionar Termo</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Lista de Termos</Text>
      <View style={styles.termsContainer}>
        <Text style={styles.term}>Termo 1</Text>
        <Text style={styles.term}>Termo 2</Text>
        <Text style={styles.term}>Termo 3</Text>
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.buttonText}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 20 },
  button: { backgroundColor: '#2979FF', padding: 15, borderRadius: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 18, marginVertical: 10 },
  termsContainer: { marginTop: 20 },
  term: { fontSize: 16, color: '#555', padding: 10 },
  deleteButton: { backgroundColor: '#f44336', padding: 10, marginTop: 5, borderRadius: 5 },  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  }
});

export default DictionaryScreen;
