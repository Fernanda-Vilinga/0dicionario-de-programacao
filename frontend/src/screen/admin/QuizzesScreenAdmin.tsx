import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  StyleSheet,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import API_BASE_URL from 'src/config';
import HeaderComum from '../HeaderComum';

const id = "mZkU0DJhVMqoIfychMd2";

interface Quiz {
  id: string;
  pergunta: string;
  opcoes: string[];
  respostaCorreta: number;
  categoria: string;
  date: string;
}

const QuizzesScreen = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  
  // Estados do formulário do modal
  const [quizPergunta, setQuizPergunta] = useState('');
  const [quizCategoria, setQuizCategoria] = useState('');
  const [quizOpcoes, setQuizOpcoes] = useState<string[]>([]);
  const [newOpcao, setNewOpcao] = useState('');
  const [respostaCorreta, setRespostaCorreta] = useState<number>(0);
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
      setQuizPergunta(quiz.pergunta);
      setQuizCategoria(quiz.categoria);
      setQuizOpcoes(quiz.opcoes);
      setRespostaCorreta(quiz.respostaCorreta);
    } else {
      setQuizPergunta('');
      setQuizCategoria('');
      setQuizOpcoes([]);
      setNewOpcao('');
      setRespostaCorreta(0);
      setSelectedQuiz(null);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleAddOpcao = () => {
    if (newOpcao.trim()) {
      setQuizOpcoes([...quizOpcoes, newOpcao.trim()]);
      setNewOpcao('');
    }
  };

  const handleDeleteOpcao = (index: number) => {
    const newOpcoes = quizOpcoes.filter((_, i) => i !== index);
    setQuizOpcoes(newOpcoes);
    if (respostaCorreta >= newOpcoes.length) {
      setRespostaCorreta(0);
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizPergunta.trim() || !quizCategoria.trim() || quizOpcoes.length === 0) {
      Alert.alert('Erro', 'Preencha todos os campos, adicione pelo menos uma opção e selecione a categoria.');
      return;
    }
  
    const payload = {
      pergunta: quizPergunta,
      categoria: quizCategoria,
      opcoes: quizOpcoes,
      respostaCorreta: respostaCorreta,
    };
  
    try {
      const url = modalType === 'add'
        ? `${API_BASE_URL}/quiz/perguntas`
        : `${API_BASE_URL}/quiz/perguntas/${selectedQuiz?.id}`;
      const method = modalType === 'add' ? 'POST' : 'PUT';
  
      console.log('Enviando requisição para:', url, 'com método:', method);
      console.log('Payload:', payload);
  
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleDeleteQuiz = async (id: string): Promise<void> => {
    try {
      // Envia a requisição DELETE sem body
      const response = await fetch(`${API_BASE_URL}/quiz/perguntas/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // Tenta ler a mensagem de erro, se disponível
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao excluir o quiz');
      }
      
      Alert.alert('Sucesso', 'Quiz excluído!');
      // Atualiza a lista local removendo o quiz excluído
      setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
    } catch (error) {
      console.error('Erro ao excluir quiz:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Ocorreu um erro desconhecido');
    }
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
              <Text style={styles.quizCategory}>{item.categoria || 'Sem categoria'}</Text>
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
            <TextInput 
              style={styles.input} 
              placeholder="Título da Pergunta" 
              value={quizPergunta} 
              onChangeText={setQuizPergunta} 
            />
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Categoria</Text>
              <Picker
                selectedValue={quizCategoria}
                onValueChange={(itemValue) => setQuizCategoria(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Selecione uma categoria" value="" />
                <Picker.Item label="Selecione uma categoria" value="" />
                <Picker.Item label="Desenvolvimento Web" value="desenvolvimento-web" />
                <Picker.Item label="Desenvolvimento Mobile" value="desenvolvimento-mobile" />
                <Picker.Item label="Ciência de Dados" value="ciencia-dados" />
                <Picker.Item label="DevOps & Infraestrutura" value="devops-infra" />
                <Picker.Item label="Desenvolvimento de Jogos" value="desenvolvimento-jogos" />
                <Picker.Item label="Programação de Sistemas" value="programacao-sistemas" />
              </Picker>
            </View>
            <Text style={styles.label}>Opções de Resposta</Text>
            <ScrollView style={{ maxHeight: 150, marginBottom: 10 }}>
              {quizOpcoes.map((opcao, index) => (
                <View key={index} style={styles.opcaoContainer}>
                  <Text style={styles.opcaoText}>{`${index + 1}. ${opcao}`}</Text>
                  <TouchableOpacity style={styles.deleteOpcaoButton} onPress={() => handleDeleteOpcao(index)}>
                    <Text style={styles.deleteOpcaoButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={styles.addOpcaoContainer}>
              <TextInput
                style={styles.inputOpcao}
                placeholder="Adicionar opção"
                value={newOpcao}
                onChangeText={setNewOpcao}
              />
              <TouchableOpacity style={styles.addOpcaoButton} onPress={handleAddOpcao}>
                <Text style={styles.addOpcaoButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Resposta Correta</Text>
              <Picker
                selectedValue={respostaCorreta}
                onValueChange={(itemValue) => setRespostaCorreta(itemValue)}
                style={styles.picker}
              >
                {quizOpcoes.map((_, index) => (
                  <Picker.Item key={index} label={`Opção ${index + 1}`} value={index} />
                ))}
              </Picker>
            </View>
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

const handleDeleteOpcao = (index: number) => {
  // Essa função precisa ser definida dentro do componente para acessar o estado.
  // No código atual, ela é definida dentro do componente acima.
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
  picker: { height: 50, width: '100%', borderWidth: 1, borderColor: '#ccc' },
  opcaoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  opcaoText: { flex: 1, fontSize: 14, color: '#333' },
  deleteOpcaoButton: { backgroundColor: 'red', padding: 5, borderRadius: 5 },
  deleteOpcaoButtonText: { color: '#fff', fontWeight: 'bold' },
  addOpcaoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inputOpcao: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5 },
  addOpcaoButton: { backgroundColor: '#2979FF', padding: 10, borderRadius: 5, marginLeft: 10 },
  addOpcaoButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default QuizzesScreen;
