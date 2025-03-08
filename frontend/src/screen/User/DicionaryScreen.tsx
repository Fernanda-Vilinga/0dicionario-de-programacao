import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import HeaderComum from '../HeaderComum';
import API_BASE_URL from 'src/config';

const DicionarioHome = () => {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoritos, setFavoritos] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    carregarTodosOsTermos();
  }, []);

  const carregarTodosOsTermos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/dicionario/todos`);
      if (!response.ok) throw new Error('Erro ao buscar termos.');

      const data = await response.json();
      setResultados(data);
    } catch (error) {
      console.error('Erro ao carregar termos:', error);
      Alert.alert("Erro", "Não foi possível carregar os termos.");
    } finally {
      setLoading(false);
    }
  };

  const pesquisarTermo = async () => {
    if (!termo.trim()) {
      Alert.alert("Aviso", "Digite um termo para pesquisar.");
      return;
    }

    setLoading(true);
    try {
      const url = `${API_BASE_URL}/dicionario/termos?termo=${encodeURIComponent(termo)}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Erro ao buscar termo.");
      }

      const data = await response.json();
      setResultados(data);
    } catch (error) {
      console.error('Erro ao buscar termo:', error);
      Alert.alert("Erro", error instanceof Error ? error.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  const alternarFavorito = (id: string) => {
    setFavoritos((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const falarTermo = (texto: string) => {
    if (Platform.OS === 'web') {
      console.log("Fala não suportada na Web");
    } else {
      Speech.speak(texto);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Dicionário" />
      <Text style={styles.title}>Enriqueça o teu vocabulário</Text>

      <View style={styles.searchContainer}>
        <TextInput 
          placeholder="Pesquisar..."
          style={styles.textInput}
          value={termo}
          onChangeText={setTermo}
          onSubmitEditing={pesquisarTermo}
        />
        <TouchableOpacity style={styles.searchButton} onPress={pesquisarTermo}>
          <MaterialIcons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#2979FF" style={styles.loading} />}

      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.resultCard}>
            <View style={styles.headerRow}>
              <View style={styles.termContainer}>
                <Text style={styles.term}>{item.termo}</Text>
                <TouchableOpacity onPress={() => falarTermo(item.termo)}>
                  <MaterialIcons name="volume-up" size={22} color="#555" style={styles.icon} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => alternarFavorito(item.id)}>
                <MaterialIcons 
                  name={favoritos[item.id] ? "favorite" : "favorite-border"} 
                  size={24} 
                  color={favoritos[item.id] ? "red" : "#888"} 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.definition}>{item.definicao}</Text>
            <Text style={styles.language}>Linguagem: {item.linguagem || 'Geral'}</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.example}>Exemplo:</Text>
              <Text style={styles.codeBlock}>{item.exemplos?.[0] || 'Nenhum exemplo disponível.'}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Nenhum resultado encontrado.</Text> : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: 'black', textAlign: 'center', marginBottom: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  textInput: { flex: 1, backgroundColor: '#E0E3E7', padding: 10, borderRadius: 5 },
  searchButton: { padding: 10, backgroundColor: '#2979FF', borderRadius: 5, marginLeft: 10 },
  resultCard: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 8, 
    marginVertical: 5, 
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#2979FF'
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  termContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  term: { fontSize: 18, fontWeight: 'bold', color: '#2979FF' },
  icon: { marginLeft: 5 },
  definition: { fontSize: 14, color: '#333', marginTop: 5 },
  language: { fontSize: 12, color: '#777', marginTop: 5 },
  codeContainer: { marginTop: 10, backgroundColor: '#E0E3E7', padding: 10, borderRadius: 5 },
  example: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  codeBlock: { 
    fontSize: 12, 
    fontFamily: 'monospace', 
    backgroundColor: '#f0f0f0', 
    padding: 5, 
    borderRadius: 5,
    marginTop: 5
  },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#777' },
  loading: { marginVertical: 20 },
});

export default DicionarioHome;
