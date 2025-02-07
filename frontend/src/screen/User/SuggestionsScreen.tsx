import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import HeaderComum from '../HeaderComum'
const SugestoesScreen = () => {
  return (
    <View>

        <View style={styles.header}>
<HeaderComum  screenName="Sugestões"/>
        </View>
        <View style={styles.container}>
      <Text style={styles.title}>Contribua para o crescimento da nossa App</Text>
      <ScrollView style={styles.suggestionsContainer}>
        <Text style={styles.suggestion}>Sugestão 1: Adicionar mais termos de programação ao dicionário.</Text>
        <Text style={styles.suggestion}>Sugestão 2: Melhorar o algoritmo de recomendações de mentores.</Text>
        <Text style={styles.suggestion}>Sugestão 3: Incluir mais quizzes interativos para os usuários.</Text>
        <Text style={styles.suggestion}>Sugestão 1: Adicionar mais termos de programação ao dicionário.</Text>
        <Text style={styles.suggestion}>Sugestão 2: Melhorar o algoritmo de recomendações de mentores.</Text>
        <Text style={styles.suggestion}>Sugestão 3: Incluir mais quizzes interativos para os usuários.</Text>
        <Text style={styles.suggestion}>Sugestão 1: Adicionar mais termos de programação ao dicionário.</Text>
        <Text style={styles.suggestion}>Sugestão 2: Melhorar o algoritmo de recomendações de mentores.</Text>
        <Text style={styles.suggestion}>Sugestão 3: Incluir mais quizzes interativos para os usuários.</Text>
      </ScrollView>
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
  suggestionsContainer: {
    marginTop: 10,
    width:700,

  },
  suggestion: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default SugestoesScreen;
