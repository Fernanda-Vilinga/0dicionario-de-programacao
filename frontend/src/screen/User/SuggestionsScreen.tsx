import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from 'src/config';
import Header from '../HeaderComum';
const categorias = [
  'Dicionário',
  'Quiz',
  'Bloco de Notas',
  'Mentoria',
  'Técnico',
];

const SugestaoScreen = () => {
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [usuarioId, setUsuarioId] = useState('');
  const [sugestoes, setSugestoes] = useState([]);

  useEffect(() => {
    const obterUsuarioId = async () => {
      const id = await AsyncStorage.getItem('usuarioId');
      if (id) {
        setUsuarioId(id);
        console.log('Usuário logado:', id);
        buscarSugestoes(id);
      } else {
        Alert.alert('Erro', 'Usuário não autenticado.');
      }
    };

    obterUsuarioId();
  }, []);

  const handleEnviar = async () => {
    if (!categoria || !descricao) {
      return Alert.alert('Atenção', 'Preencha todos os campos!');
    }

    try {
      setLoading(true);

      const payload = {
        usuarioId,
        categoria,
        descricao,
        status: 'pendente',
      };

      console.log('Enviando sugestão:', payload);

      await axios.post(`${API_BASE_URL}/sugestoes`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      setCategoria('');
      setDescricao('');
      Alert.alert('Sucesso', 'Sugestão enviada com sucesso!');
      buscarSugestoes(usuarioId); // Atualiza lista
    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      Alert.alert('Erro', 'Não foi possível enviar a sugestão.');
    } finally {
      setLoading(false);
    }
  };

  const buscarSugestoes = async (id: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sugestoes`);
      const todas = response.data;
      const minhas = todas.filter((s: any) => s.usuarioId === id);
      setSugestoes(minhas);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    }
  };

  return (
   
      <View style={styles.container}>
            <Header screenName="Sugestões" />
        <Text style={styles.titulo}>Enviar Sugestão</Text>
    
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={categoria}
            onValueChange={setCategoria}
            style={styles.picker}
          >
            <Picker.Item label="Selecione uma categoria" value="" />
            {categorias.map((cat, index) => (
              <Picker.Item key={index} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
    
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          placeholder="Descreva sua sugestão..."
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
    
        <TouchableOpacity style={styles.botao} onPress={handleEnviar} disabled={loading}>
          <Text style={styles.botaoTexto}>
            {loading ? 'Enviando...' : 'Enviar Sugestão'}
          </Text>
        </TouchableOpacity>
    
        {/* Lista de sugestões */}
        <Text style={[styles.titulo, { marginTop: 30 }]}>Minhas Sugestões</Text>
    
        <View style={styles.listaContainer}>
          <FlatList
            data={sugestoes}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: any) => (
              <View style={styles.sugestaoCard}>
                <Text style={styles.sugestaoCategoria}>{item.categoria}</Text>
                <Text style={styles.sugestaoDescricao}>{item.descricao}</Text>
                <Text style={styles.sugestaoStatus}>Status: {item.status}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    );
    
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2979FF',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 100,
  },
  botao: {
    backgroundColor: '#2979FF',
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sugestaoCard: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sugestaoCategoria: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2979FF',
  },
  sugestaoDescricao: {
    marginTop: 6,
    fontSize: 14,
    color: '#333',
  },
  sugestaoStatus: {
    marginTop: 6,
    fontSize: 13,
    color: '#666',
  },listaContainer: {
    flex: 1,
    marginTop: 10,
  },
  
});

export default SugestaoScreen;
