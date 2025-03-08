import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal, Alert 
} from 'react-native';
import HeaderComum from '../HeaderComum';
import API_BASE_URL from 'src/config';
import { MaterialIcons } from '@expo/vector-icons';

interface Term {
  id: string;
  termo: string;
  definicao: string;
  exemplos?: string[];
  linguagem?: string;
  // O campo de pronúncia foi removido para o admin
}

const DictionaryScreen: React.FC = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [termInput, setTermInput] = useState<string>('');
  const [definitionInput, setDefinitionInput] = useState<string>('');
  const [exampleInput, setExampleInput] = useState<string>('');
  const [languageInput, setLanguageInput] = useState<string>('');
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dicionario/todos`);
      const data = await response.json();
      setTerms(data);
    } catch (error) {
      console.error('Erro ao buscar termos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os termos.');
    }
  };

  const handleSaveTerm = async () => {
    if (!termInput || !definitionInput || !languageInput) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios: termo, definição e linguagem.');
      return;
    }

    const termData = {
      termo: termInput,
      definicao: definitionInput,
      exemplos: exampleInput ? [exampleInput] : [],
      linguagem: languageInput,
    };

    try {
      if (editingTerm) {
        // Atualiza termo existente (endpoint PUT /dicionario/termo/:id)
        const response = await fetch(`${API_BASE_URL}/dicionario/termo/${editingTerm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(termData),
        });
        if (!response.ok) throw new Error('Erro ao atualizar termo');
      } else {
        // Adiciona novo termo (endpoint POST /dicionario/termo)
        const response = await fetch(`${API_BASE_URL}/dicionario/termo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(termData),
        });
        if (!response.ok) throw new Error('Erro ao adicionar termo');
      }
      setModalVisible(false);
      setEditingTerm(null);
      setTermInput('');
      setDefinitionInput('');
      setExampleInput('');
      setLanguageInput('');
      fetchTerms();
    } catch (error) {
      console.error('Erro ao salvar termo:', error);
      Alert.alert('Erro', 'Não foi possível salvar o termo.');
    }
  };

  const handleEditTerm = (term: Term): void => {
    setEditingTerm(term);
    setTermInput(term.termo);
    setDefinitionInput(term.definicao);
    setExampleInput(term.exemplos && term.exemplos.length > 0 ? term.exemplos[0] : '');
    setLanguageInput(term.linguagem || '');
    setModalVisible(true);
  };

  const handleDeleteTerm = async (id: string): Promise<void> => {
    Alert.alert('Excluir termo', 'Tem certeza que deseja excluir este termo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/dicionario/termo/${id}`, {
              method: 'DELETE',
            });
            if (!response.ok) throw new Error('Erro ao excluir termo');
            fetchTerms();
          } catch (error) {
            console.error('Erro ao excluir termo:', error);
            Alert.alert('Erro', 'Não foi possível excluir o termo.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Gerenciar Dicionário" />
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Adicionar Termo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton} >
        <Text style={styles.buttonText}>Ver sugestões</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>Lista de Termos</Text>
      <FlatList
        data={terms}
        keyExtractor={(item: Term) => item.id}
        renderItem={({ item }: { item: Term }) => (
          <View style={styles.termRow}>
            <View style={styles.termContent}>
              <Text style={styles.term}>{item.termo}</Text>
              <Text style={styles.definition}>{item.definicao}</Text>
              <Text style={styles.language}>Linguagem: {item.linguagem || 'Geral'}</Text>
              {item.exemplos && item.exemplos.length > 0 && (
                <Text style={styles.example}>Exemplo: {item.exemplos[0]}</Text>
              )}
            </View>
            <View style={styles.crudActions}>
              <TouchableOpacity onPress={() => handleEditTerm(item)} style={styles.actionButton}>
                <MaterialIcons name="edit" size={24} color="#2979FF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteTerm(item.id)} style={styles.actionButton}>
                <MaterialIcons name="delete" size={24} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color="#888" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Digite o termo"
              value={termInput}
              onChangeText={setTermInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Digite a definição"
              value={definitionInput}
              onChangeText={setDefinitionInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Digite um exemplo"
              value={exampleInput}
              onChangeText={setExampleInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Digite a linguagem"
              value={languageInput}
              onChangeText={setLanguageInput}
            />
            <TouchableOpacity style={styles.button} onPress={handleSaveTerm}>
              <Text style={styles.buttonText}>
                {editingTerm ? 'Salvar Alterações' : 'Adicionar Termo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  addButton: { backgroundColor: '#2979FF', padding: 15, borderRadius: 5, marginBottom: 15 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    marginVertical: 5,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  termContent: { flex: 1 },
  term: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  definition: { fontSize: 14, color: '#555', marginTop: 5 },
  language: { fontSize: 14, fontStyle: 'italic', color: '#666', marginTop: 5 },
  example: { fontSize: 14, color: '#444', fontWeight: 'bold', marginTop: 5 },
  crudActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  actionButton: { marginHorizontal: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center' },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, width: '100%', marginVertical: 5 },
  button: { backgroundColor: '#2979FF', padding: 15, borderRadius: 5, width: '100%' },
  cancelButton: { backgroundColor: '#B0BEC5', padding: 15, borderRadius: 5, width: '100%', marginTop: 10 },
});

export default DictionaryScreen;
