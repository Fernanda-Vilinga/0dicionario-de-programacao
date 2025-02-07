import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import HeaderComum from '../HeaderComum'
const HistoricoScreen = () => {
  const historico = [
    'Termo 1: Aprendido em 01/01/2025',
    'Termo 2: Aprendido em 02/01/2025',
    'Termo 3: Aprendido em 03/01/2025',
    'Quiz 1: Concluído em 01/01/2025',
    'Mentoria com Mentor X: Agendada em 04/01/2025',
    'Termo 1: Aprendido em 01/01/2025',
    'Termo 2: Aprendido em 02/01/2025',
    'Termo 3: Aprendido em 03/01/2025',
    'Quiz 1: Concluído em 01/01/2025',
    'Mentoria com Mentor X: Agendada em 04/01/2025',
  ];

  return (
    <View >
         
        <View style={styles.header}>
<HeaderComum  screenName="Histórico"/>
        </View>
        <View style={styles.container}>
      <Text style={styles.title}>Vê suas últimas actividades !</Text>
      <FlatList
        data={historico}
        renderItem={({ item }) => <Text style={styles.item}>{item}</Text>}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent:'center',
    alignItems:'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  item: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,width:700,
  },
  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default HistoricoScreen;
