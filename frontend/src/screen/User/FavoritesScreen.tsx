import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import HeaderComum from '../HeaderComum';

const FavoritosScreen = () => {
  const favoritos = [
    'Termo 1',
    'Termo 2',
    'Termo 3',
    'Termo 4',
    'Termo 5',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderComum screenName="Favoritos" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Seus conteúdos favoritos</Text>
        <FlatList
          data={favoritos}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60, // Ajuste a altura do header conforme necessário
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: 'center', // Centraliza o conteúdo verticalmente
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
    marginTop:20
  },
  item: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
});

export default FavoritosScreen;
