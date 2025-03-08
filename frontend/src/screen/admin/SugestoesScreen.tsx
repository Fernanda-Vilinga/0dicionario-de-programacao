import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import API_BASE_URL from 'src/config';

interface Sugestao {
  id: string;
  termo: string;
}

const SugestoesScreen = () => {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSugestoes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/sugestoes`);
        const data: Sugestao[] = await response.json();
        setSugestoes(data);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSugestoes();
  }, []);

  const aceitarSugestao = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/aceitar-sugestao/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setSugestoes((prevSugestoes) => prevSugestoes.filter((sugestao) => sugestao.id !== id));
      } else {
        console.error('Erro ao aceitar sugestão');
      }
    } catch (error) {
      console.error('Erro ao aceitar sugestão:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sugestões para o Dicionário</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2979FF" />
      ) : (
        <ScrollView style={styles.suggestionsContainer}>
          {sugestoes.length > 0 ? (
            sugestoes.map((item: Sugestao) => (
              <View key={item.id} style={styles.suggestionItem}>
                <Text style={styles.suggestionText}>{item.termo}</Text>
                <TouchableOpacity style={styles.acceptButton} onPress={() => aceitarSugestao(item.id)}>
                  <Text style={styles.acceptButtonText}>Aceitar</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.suggestionText}>Nenhuma sugestão encontrada.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: 'black' },
  suggestionsContainer: { marginTop: 10 },
  suggestionItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 10, backgroundColor: '#fff', borderRadius: 8 },
  suggestionText: { fontSize: 16, color: '#555' },
  acceptButton: { backgroundColor: '#2979FF', padding: 10, borderRadius: 5 },
  acceptButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default SugestoesScreen;
