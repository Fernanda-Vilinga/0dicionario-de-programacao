import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from 'src/config';
import HeaderComum from '../HeaderComum';
import { ThemeContext } from 'src/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH * 0.9;

interface Quiz {
  id: string;
  usuarioId: string;
  pergunta: string;
  opcoes: string[];
  respostaCorreta: number;
  categoria: string;
  date: string;
}

const QuizzesScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizPergunta, setQuizPergunta] = useState('');
  const [quizCategoria, setQuizCategoria] = useState('');
  const [quizOpcoes, setQuizOpcoes] = useState<string[]>([]);
  const [newOpcao, setNewOpcao] = useState('');
  const [respostaCorreta, setRespostaCorreta] = useState(0);
  const [quizToDeleteId, setQuizToDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchQuizzes(); }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/perguntas`);
      const data: Quiz[] = await response.json();
      data.sort((a, b) => a.categoria.localeCompare(b.categoria));
      setQuizzes(data);
    } catch (error) {
      console.error('Falha ao carregar quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: 'add' | 'edit', quiz?: Quiz) => {
    setModalType(type);
    if (type === 'edit' && quiz) {
      setSelectedQuiz(quiz);
      setQuizPergunta(quiz.pergunta);
      setQuizCategoria(quiz.categoria);
      setQuizOpcoes(quiz.opcoes);
      setRespostaCorreta(quiz.respostaCorreta);
    } else {
      setSelectedQuiz(null);
      setQuizPergunta('');
      setQuizCategoria('');
      setQuizOpcoes([]);
      setNewOpcao('');
      setRespostaCorreta(0);
    }
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const handleAddOpcao = () => {
    if (newOpcao.trim()) {
      setQuizOpcoes(prev => [...prev, newOpcao.trim()]);
      setNewOpcao('');
    }
  };

  const handleDeleteOpcao = (idx: number) => {
    const ops = quizOpcoes.filter((_, i) => i !== idx);
    setQuizOpcoes(ops);
    if (respostaCorreta >= ops.length) setRespostaCorreta(0);
  };

  const handleSaveQuiz = async () => {
    console.log('📋 Salvando quiz:', {
      mode: modalType,
      selectedId: selectedQuiz?.id,
      payload: { pergunta: quizPergunta, categoria: quizCategoria, opcoes: quizOpcoes, respostaCorreta }
    });

    if (!quizPergunta.trim() || !quizCategoria.trim() || quizOpcoes.length === 0) {
      // abrir modal de erro customizado
      return;
    }

    const payload = { pergunta: quizPergunta, categoria: quizCategoria, opcoes: quizOpcoes, respostaCorreta };
    const isEdit = modalType === 'edit' && selectedQuiz;
    const url = isEdit
      ? `${API_BASE_URL}/quiz/perguntas/${selectedQuiz!.id}`
      : `${API_BASE_URL}/quiz/perguntas`;
    const method = isEdit ? 'PUT' : 'POST';
    console.log('➡️ Fetch', method, url);

    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      console.log('✅ Quiz salvo com sucesso');
      await fetchQuizzes();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar quiz:', error);
    }
  };

  const confirmDelete = (id: string) => {
    setQuizToDeleteId(id);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!quizToDeleteId) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/quiz/perguntas/${quizToDeleteId}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      console.log('✅ Quiz excluído:', quizToDeleteId);
      setQuizzes(prev => prev.filter(q => q.id !== quizToDeleteId));
      setDeleteModalVisible(false);
    } catch (error) {
      console.error('Erro ao excluir quiz:', error);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Gerenciar Quizzes" />
      {loading ? (
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.quizCard}>
              <Text style={styles.quizTitle}>{item.pergunta}</Text>
              <Text style={styles.quizCategory}>{item.categoria}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.button} onPress={() => openModal('edit', item)}>
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
                  <Text style={styles.buttonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.salvarButton2} onPress={() => openModal('add')}>
        <Text style={styles.buttonText}>Adicionar Quiz</Text>
      </TouchableOpacity>

      {/* Modal add/edit */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalType === 'add' ? 'Adicionar' : 'Editar'} Quiz</Text>
            <TextInput
              style={styles.input}
              placeholder="Pergunta"
              placeholderTextColor={theme.placeholderTextColor}
              value={quizPergunta}
              onChangeText={setQuizPergunta}
            />
            <TextInput
              style={styles.input}
              placeholder="Categoria"
              placeholderTextColor={theme.placeholderTextColor}
              value={quizCategoria}
              onChangeText={setQuizCategoria}
            />
            <ScrollView style={styles.opcoesList}>
              {quizOpcoes.map((op, i) => (
                <View key={i} style={styles.opcaoRow}>
                  <Text style={styles.opcaoText}>{op}</Text>
                  <TouchableOpacity onPress={() => handleDeleteOpcao(i)}>
                    <Text style={{ color: 'red' }}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={styles.addOpcaoRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Nova opção"
                placeholderTextColor={theme.placeholderTextColor}
                value={newOpcao}
                onChangeText={setNewOpcao}
              />
              <TouchableOpacity style={[styles.button, { marginLeft: 8 }]} onPress={handleAddOpcao}>
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Resposta Correta</Text>
            <Picker selectedValue={respostaCorreta} onValueChange={setRespostaCorreta} style={styles.picker}>
              {quizOpcoes.map((_, i) => (
                <Picker.Item key={i} label={`Opção ${i + 1}`} value={i} />
              ))}
            </Picker>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.salvarButton} onPress={handleSaveQuiz}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal delete confirmation */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>Confirmar exclusão?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleConfirmDelete}>
                <Text style={styles.buttonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundColor, padding: 20 },
  quizCard: { backgroundColor: theme.cardBackground, padding: 12, marginVertical: 8, borderRadius: 8 },
  quizTitle: { fontSize: 16, fontWeight: 'bold', color: theme.textColor },
  quizCategory: { fontSize: 14, color: theme.textColorSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 10 },
  button: { backgroundColor: theme.buttonBackground, padding: 8, borderRadius: 5, marginRight: 8 },
  deleteButton: { backgroundColor: 'red', padding: 8, borderRadius: 5 },
  buttonText: { color: theme.buttonText || '#fff', fontWeight: 'bold' },
  addButton: { backgroundColor: theme.buttonBackground, padding: 12, borderRadius: 8, position: 'absolute', bottom: 20, alignSelf: 'center', width: '90%' },
  listContent: { paddingBottom: 80 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { width: MODAL_WIDTH, backgroundColor: theme.backgroundColor, padding: 16, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: theme.textColor, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: theme.borderColor, padding: 10, borderRadius: 5, marginBottom: 10, color: theme.textColor },
  opcoesList: { maxHeight: 100, marginBottom: 10 },
  opcaoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  opcaoText: { color: theme.textColor },
  addOpcaoRow: { flexDirection: 'row', marginBottom: 10 },
  label: { color: theme.textColor, fontWeight: 'bold', marginBottom: 4 },
  picker: { borderWidth: 1, borderColor: theme.borderColor, borderRadius: 5, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  salvarButton: { backgroundColor: theme.buttonBackground, padding: 10, borderRadius: 5, flex: 1,
     marginRight: 8, alignItems: 'center' },
       salvarButton2: { backgroundColor: theme.buttonBackground, padding: 22, borderRadius: 5, flex: 1,
     marginRight: 4, alignItems: 'center' },
  cancelButton: { backgroundColor: 'gray', padding: 10, borderRadius: 5, flex: 1, marginRight: 8, alignItems: 'center' },
  confirmBox: { width: MODAL_WIDTH * 0.8, backgroundColor: theme.backgroundColor, padding: 20, borderRadius: 10, alignItems: 'center' },
  confirmText: { color: theme.textColor, fontSize: 16, marginBottom: 12 },
});

export default QuizzesScreen;
