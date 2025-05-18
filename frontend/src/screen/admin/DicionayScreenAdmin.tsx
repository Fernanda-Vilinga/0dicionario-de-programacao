import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import HeaderComum from '../HeaderComum';
import API_BASE_URL from 'src/config';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from 'src/context/ThemeContext';

interface Term {
  id: string;
  termo: string;
  definicao: string;
  exemplos?: string[];
  linguagem?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH * 0.9;

const DictionaryScreen: React.FC = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [termInput, setTermInput] = useState<string>('');
  const [definitionInput, setDefinitionInput] = useState<string>('');
  const [exampleInput, setExampleInput] = useState<string>('');
  const [languageInput, setLanguageInput] = useState<string>('JavaScript');
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [termToDelete, setTermToDelete] = useState<string | null>(null);

  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/dicionario/todos`);
      const data: Term[] = await response.json();
      data.sort((a, b) => a.termo.localeCompare(b.termo));
      setTerms(data);
    } catch (error) {
      console.error('Erro ao buscar termos:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingTerm(null);
    setTermInput('');
    setDefinitionInput('');
    setExampleInput('');
    setLanguageInput('JavaScript');
    setModalVisible(false);
  };

  const handleSaveTerm = async () => {
    if (!termInput.trim() || !definitionInput.trim()) return;
    const termData = {
      termo: termInput.trim(),
      definicao: definitionInput.trim(),
      exemplos: exampleInput ? [exampleInput.trim()] : [],
      linguagem: languageInput,
    };
    try {
      const url = editingTerm
        ? `${API_BASE_URL}/dicionario/termo/${editingTerm.id}`
        : `${API_BASE_URL}/dicionario/termo`;
      const method = editingTerm ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termData),
      });
      if (!response.ok) throw new Error();
      resetForm();
      await fetchTerms();
    } catch (error) {
      console.error('Erro ao salvar termo:', error);
    }
  };

  const handleEditTerm = (term: Term) => {
    setEditingTerm(term);
    setTermInput(term.termo);
    setDefinitionInput(term.definicao);
    setExampleInput(term.exemplos?.[0] || '');
    setLanguageInput(term.linguagem || 'JavaScript');
    setModalVisible(true);
  };

  const confirmDelete = (id: string) => {
    setTermToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!termToDelete) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/dicionario/termo/${termToDelete}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error();
      setDeleteModalVisible(false);
      setTermToDelete(null);
      await fetchTerms();
    } catch (error) {
      console.error('Erro ao excluir termo:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <HeaderComum screenName="Gerenciar Dicionário" />

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.buttonBackground }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.buttonText, { color: theme.buttonText }]}>
          Adicionar Termo
        </Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      ) : (
        <FlatList
          data={terms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.termRow,
                { backgroundColor: theme.cardBackground, shadowColor: theme.cardShadow },
              ]}
            >
              <View style={styles.termContent}>
                <Text style={[styles.term, { color: theme.cardTextColor }]}>
                  {item.termo}
                </Text>
                <Text style={[styles.definition, { color: theme.textColor }]}>
                  {item.definicao}
                </Text>
                <Text style={[styles.language, { color: theme.placeholderTextColor }]}>
                  Linguagem: {item.linguagem || 'Geral'}
                </Text>
                {item.exemplos?.[0] && (
                  <Text style={[styles.example, { color: theme.textColor }]}>
                    Exemplo: {item.exemplos[0]}
                  </Text>
                )}
              </View>
              <View style={styles.crudActions}>
                <TouchableOpacity
                  onPress={() => handleEditTerm(item)}
                  style={styles.actionButton}
                >
                  <MaterialIcons name="edit" size={24} color={theme.buttonBackground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmDelete(item.id)}
                  style={styles.actionButton}
                >
                  <MaterialIcons name="delete" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal de Adição/Edição */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundColor, width: MODAL_WIDTH },
            ]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={resetForm}>
              <MaterialIcons
                name="close"
                size={24}
                color={theme.placeholderTextColor}
              />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, { color: theme.textColor, borderColor: theme.borderColor }]}
              placeholder="Digite o termo"
              placeholderTextColor={theme.placeholderTextColor}
              value={termInput}
              onChangeText={setTermInput}
            />
            <TextInput
              style={[styles.input, { color: theme.textColor, borderColor: theme.borderColor }]}
              placeholder="Digite a definição"
              placeholderTextColor={theme.placeholderTextColor}
              value={definitionInput}
              onChangeText={setDefinitionInput}
            />
            <TextInput
              style={[styles.input, { color: theme.textColor, borderColor: theme.borderColor }]}
              placeholder="Digite um exemplo"
              placeholderTextColor={theme.placeholderTextColor}
              value={exampleInput}
              onChangeText={setExampleInput}
            />
            <Picker
              selectedValue={languageInput}
              style={[styles.input, { color: theme.textColor, backgroundColor: theme.cardBackground }]}
              onValueChange={setLanguageInput}
            >
              {['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Swift', 'Kotlin'].map(
                (lang) => (
                  <Picker.Item label={lang} value={lang} key={lang} />
                )
              )}
            </Picker>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.buttonBackground }]}
              onPress={handleSaveTerm}
              disabled={!termInput.trim() || !definitionInput.trim()}
            >
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                {editingTerm ? 'Salvar Alterações' : 'Adicionar Termo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.borderColor }]}
              onPress={resetForm}
            >
              <Text style={[styles.buttonText, { color: theme.textColor }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.deleteModalContent,
              { backgroundColor: theme.backgroundColor, width: MODAL_WIDTH * 0.8 },
            ]}
          >
            <Text style={[styles.deleteText, { color: theme.textColor }]}>
              Tem certeza que deseja excluir este termo?
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.cancelButton, { backgroundColor: theme.borderColor, marginRight: 10 }]}
              >
                <Text style={[styles.buttonText, { color: theme.textColor }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                style={[styles.button, { backgroundColor: 'red' }]}
              >
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  addButton: { padding: 15, borderRadius: 8, marginBottom: 15 },
  buttonText: { fontWeight: 'bold', textAlign: 'center' },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  termContent: { flex: 1 },
  term: { fontSize: 18, fontWeight: '700' },
  definition: { fontSize: 14, marginTop: 6 },
  language: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },
  example: { fontSize: 14, fontWeight: '600', marginTop: 6 },
  crudActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  actionButton: { marginHorizontal: 6 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: { padding: 20, borderRadius: 10, alignItems: 'center' },
  deleteModalContent: { padding: 20, borderRadius: 10, alignItems: 'center' },
  deleteText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  deleteButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  closeButton: { alignSelf: 'flex-end', marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 6, padding: 12, width: '100%', marginVertical: 6 },
  button: { padding: 15, borderRadius: 8, flex: 1 },
  cancelButton: { padding: 15, borderRadius: 8, flex: 1 },
});

export default DictionaryScreen;
