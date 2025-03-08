import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import API_BASE_URL from 'src/config';
import HeaderComum from '../HeaderComum';

interface Quiz {
  id: string;
  pergunta: string;
  resposta: string;
  category?: string;
  date?: string;
}

const QuizzesScreen = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCategory, setQuizCategory] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/perguntas`);
      const data: Quiz[] = await response.json();
      setQuizzes(data);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const openModal = (type: 'add' | 'edit', quiz?: Quiz) => {
    setModalType(type);
    if (type === 'edit' && quiz) {
      setSelectedQuiz(quiz);
      setQuizTitle(quiz.pergunta);
      setQuizCategory(quiz.category || '');
    } else {
      setQuizTitle('');
      setQuizCategory('');
      setSelectedQuiz(null);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };
  const handleSaveQuiz = async () => {
    console.log('Tentando salvar quiz:', { modalType, quizTitle, quizCategory, selectedQuiz });
  
    if (!quizTitle.trim() || !quizCategory.trim()) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios.');
      return;
    }
  
    try {
      const url = modalType === 'add' 
        ? `${API_BASE_URL}/quiz/perguntas` 
        : `${API_BASE_URL}/quiz/perguntas/${selectedQuiz?.id}`;
  
      const method = modalType === 'add' ? 'POST' : 'PUT';
  
      console.log('Enviando requisição para:', url, 'com método:', method);
  
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: quizTitle, category: quizCategory })
      });
  
      const responseData = await response.json();
      console.log('Resposta da API:', responseData);
  
      if (!response.ok) throw new Error(responseData.message || 'Falha ao salvar o quiz');
  
      Alert.alert('Sucesso', modalType === 'add' ? 'Quiz criado!' : 'Quiz atualizado!');
      fetchQuizzes();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar quiz:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Ocorreu um erro desconhecido');
    }
  };
  
  const handleDeleteQuiz = async (id: string) => {
    console.log('Tentando excluir quiz:', id);
  
    Alert.alert('Confirmar', 'Tem certeza que deseja excluir este quiz?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            console.log('Enviando requisição DELETE para:', `${API_BASE_URL}/quiz/perguntas/${id}`);
  
            const response = await fetch(`${API_BASE_URL}/quiz/perguntas/${id}`, { method: 'DELETE' });
            const responseData = await response.json();
  
            console.log('Resposta da API:', responseData);
  
            if (!response.ok) throw new Error(responseData.message || 'Falha ao excluir o quiz');
  
            Alert.alert('Sucesso', 'Quiz excluído!');
            fetchQuizzes();
          } catch (error) {
            console.error('Erro ao excluir quiz:', error);
            Alert.alert('Erro', error instanceof Error ? error.message : 'Ocorreu um erro desconhecido');
          }
        }
      }
    ]);
  };
  
  return (
    <View style={styles.container}>
      <HeaderComum screenName="Gerenciar Quizzes" />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={quizzes}
          renderItem={({ item }) => (
            <View style={styles.quizCard}>
              <Text style={styles.quizTitle}>{item.pergunta}</Text>
              <Text style={styles.quizCategory}>{item.category || 'Sem categoria'}</Text>
              <Text style={styles.quizDate}>{item.date || 'Data não disponível'}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.button} onPress={() => openModal('edit', item)}>
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteQuiz(item.id)}>
                  <Text style={styles.buttonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => openModal('add')}>
        <Text style={styles.buttonText}>Adicionar Quiz</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalType === 'add' ? 'Adicionar Quiz' : 'Editar Quiz'}</Text>
            <TextInput style={styles.input} placeholder="Título do Quiz" value={quizTitle} onChangeText={setQuizTitle} />
            <TextInput style={styles.input} placeholder="Categoria" value={quizCategory} onChangeText={setQuizCategory} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleSaveQuiz}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 20, paddingTop: 10 },
  quizCard: { padding: 15, marginVertical: 8, backgroundColor: '#fff', borderRadius: 10, elevation: 3 },
  quizTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  quizCategory: { fontSize: 14, color: '#555', marginTop: 2 },
  quizDate: { fontSize: 12, color: '#777', marginTop: 2 },
  actions: { flexDirection: 'row', marginTop: 10, justifyContent: 'flex-start', gap: 10 },
  button: { backgroundColor: '#2979FF', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  deleteButton: { backgroundColor: 'red', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  addButton: { backgroundColor: '#2979FF', paddingVertical: 12, borderRadius: 8, alignItems: 'center', position: 'absolute', bottom: 20, alignSelf: 'center', width: '90%' },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  listContent: { paddingBottom: 80 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { backgroundColor: '#2979FF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  cancelButton: { backgroundColor: 'gray', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  pickerContainer: { marginBottom: 10 },
label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
picker: { height: 50, width: '100%', borderWidth: 1, borderColor: '#ccc' }

});
export default QuizzesScreen;
