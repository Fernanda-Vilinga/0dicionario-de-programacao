import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Sessao {
  id: string;
  mentor: string;
  data: string;
  horario: string;
  status: string;
}

const ListaSessaoScreen: React.FC = () => {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarSessoes = async () => {
    try {
      const usuarioId = await AsyncStorage.getItem('usuarioId');
      if (!usuarioId) {
        alert('Usuário não encontrado.');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/sessoes/${usuarioId}`);
      setSessoes(response.data);
    } catch (err) {
      setError('Erro ao carregar sessões.');
    } finally {
      setLoading(false);
    }
  };

  const cancelarSessao = async (sessaoId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/sessoes/${sessaoId}`);
      setSessoes(sessoes.filter(sessao => sessao.id !== sessaoId));
      alert('Sessão cancelada com sucesso!');
    } catch (err) {
      alert('Erro ao cancelar a sessão.');
    }
  };

  useEffect(() => {
    carregarSessoes();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Carregando sessões...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Sessões</Text>
      <FlatList
        data={sessoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.sessaoCard}>
            <Text style={styles.sessaoTexto}>Mentor: {item.mentor}</Text>
            <Text style={styles.sessaoTexto}>Data: {item.data}</Text>
            <Text style={styles.sessaoTexto}>Horário: {item.horario}</Text>
            <Text style={styles.sessaoTexto}>Status: {item.status}</Text>
            <TouchableOpacity 
              style={styles.botaoCancelar} 
              onPress={() => cancelarSessao(item.id)}
            >
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  sessaoCard: { padding: 15, marginVertical: 10, backgroundColor: '#fff', borderRadius: 10 },
  sessaoTexto: { fontSize: 16, marginBottom: 10 },
  botaoCancelar: { backgroundColor: 'red', padding: 10, borderRadius: 5, alignItems: 'center' },
  textoCancelar: { color: '#fff', fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default ListaSessaoScreen;
