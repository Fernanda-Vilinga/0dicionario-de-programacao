import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Button, Alert } from 'react-native';
import HeaderComum from '../HeaderComum';

// ✅ Definição do tipo para uma sugestão
type Sugestao = {
  id: string;
  termo: string;
  definicao: string;
};

const API_URL = 'http://192.168.0.132:3030/sugestoes'; // Atualize conforme necessário

const SugestoesScreen: React.FC = () => {
  const [sugestao, setSugestao] = useState<string>('');
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);

  // 🔥 Buscar sugestões do backend
  const fetchSugestoes = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erro ao buscar sugestões.');
      const data: Sugestao[] = await response.json();
      setSugestoes(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar as sugestões.');
    }
  };

  // 🔥 Chamar a API ao abrir a tela
  useEffect(() => {
    fetchSugestoes();
  }, []);

  // 🔥 Enviar sugestão ao backend
  const enviarSugestao = async () => {
    if (!sugestao.trim()) {
      Alert.alert('Aviso', 'Digite uma sugestão antes de enviar.');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: '123456', // Substituir pelo ID real do usuário autenticado
          sugestao,
        }),
      });

      if (!response.ok) throw new Error('Erro ao enviar sugestão.');

      Alert.alert('Sucesso', 'Sugestão enviada com sucesso!');
      setSugestao('');
      fetchSugestoes(); // Atualiza a lista de sugestões
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao enviar a sugestão.');
    }
  };

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Sugestões" />
      <Text style={styles.title}>Contribua para o crescimento da nossa App</Text>

      {/* Campo de entrada para a sugestão */}
      <TextInput
        style={styles.input}
        placeholder="Digite sua sugestão..."
        value={sugestao}
        onChangeText={setSugestao}
      />

      {/* Botão para enviar a sugestão */}
      <Button title="Enviar Sugestão" onPress={enviarSugestao} color="#004AAD" />

      <ScrollView style={styles.suggestionsContainer}>
        {sugestoes.length > 0 ? (
          sugestoes.map((item) => (
            <Text key={item.id} style={styles.suggestion}>
              {item.termo} - {item.definicao}
            </Text>
          ))
        ) : (
          <Text style={styles.suggestion}>Nenhuma sugestão ainda...</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: 'black',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  suggestionsContainer: {
    marginTop: 15,
  },
  suggestion: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default SugestoesScreen;
