import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import HeaderComum from '../HeaderComum'
const UsersScreen = () => {
  const users = [
    { id: '1', name: 'Fernanda Vilinga', email: 'fernanda28@email.com' },
    { id: '2', name: 'Ludmilson Panzo', email: 'luddy07@email.com' },
    // Adicionar mais usuários conforme necessário
  ];

  return (
    <View style={styles.container}>
        <View style={styles.header}>
        <HeaderComum  screenName="Gerenciar Usuários"/>
                </View>
     

      <FlatList
        data={users}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text style={styles.userText}>{item.name}</Text>
            <Text style={styles.userText}>{item.email}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Promover para mentor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Remover</Text>
              </TouchableOpacity>
            </View>
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
  userCard: { padding: 15, marginVertical: 10, backgroundColor: '#ffffff', borderRadius: 10, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  userText: { fontSize: 16, color: '#555' },
  actions: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-around' },
  button: { backgroundColor: '#2979FF', padding: 10, borderRadius: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  }
});

export default UsersScreen;
