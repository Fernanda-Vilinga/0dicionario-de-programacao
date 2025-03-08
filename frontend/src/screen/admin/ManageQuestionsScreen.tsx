import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import HeaderComum from '../HeaderComum';

type RootStackParamList = {
  QuizzesScreen: undefined;
  ManageQuestionsScreen: { quizId: string };
};

type Props = StackScreenProps<RootStackParamList, 'QuizzesScreen'>;

interface Quiz {
  id: string;
  title: string;
  category: string;
  date: string;
}

const QuizzesScreen: React.FC<Props> = ({ navigation }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    { id: '1', title: 'Quiz de Programação', category: 'Geral', date: '2025-02-04' },
    { id: '2', title: 'Quiz de JavaScript', category: 'Linguagem', date: '2025-02-03' },
  ]);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | ''>('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCategory, setQuizCategory] = useState('');

  const openModal = (type: 'add' | 'edit', quiz: Quiz | null = null) => {
    setModalType(type);
    setSelectedQuiz(quiz);
    if (quiz) {
      setQuizTitle(quiz.title);
      setQuizCategory(quiz.category);
    } else {
      setQuizTitle('');
      setQuizCategory('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedQuiz(null);
  };

  const handleSaveQuiz = () => {
    if (!quizTitle.trim() || !quizCategory.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    if (modalType === 'add') {
      const newQuiz: Quiz = {
        id: Math.random().toString(),
        title: quizTitle,
        category: quizCategory,
        date: new Date().toISOString().split('T')[0], // Formata a data atual
      };
      setQuizzes([...quizzes, newQuiz]);
    } else if (modalType === 'edit' && selectedQuiz) {
      setQuizzes(
        quizzes.map((quiz) =>
          quiz.id === selectedQuiz.id ? { ...quiz, title: quizTitle, category: quizCategory } : quiz
        )
      );
    }

    closeModal();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Excluir Quiz', 'Tem certeza que deseja excluir este quiz?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', onPress: () => setQuizzes(quizzes.filter(quiz => quiz.id !== id)) },
    ]);
  };

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Gerenciar Quizzes" />

      <FlatList
        data={quizzes}
        renderItem={({ item }) => (
          <View style={styles.quizCard}>
            <Text style={styles.quizTitle}>{item.title}</Text>
            <Text style={styles.quizCategory}>{item.category}</Text>
            <Text style={styles.quizDate}>{item.date}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ManageQuestionsScreen', { quizId: item.id })}>
                <Text style={styles.buttonText}>Gerenciar Perguntas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => openModal('edit', item)}>
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Text style={styles.buttonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => openModal('add')}>
        <Text style={styles.buttonText}>Adicionar Quiz</Text>
      </TouchableOpacity>

      {/* Modal para Adicionar/Editar Quiz */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalType === 'add' ? 'Adicionar Quiz' : 'Editar Quiz'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Título do Quiz"
              value={quizTitle}
              onChangeText={setQuizTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Categoria"
              value={quizCategory}
              onChangeText={setQuizCategory}
            />

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
});

export default QuizzesScreen;
