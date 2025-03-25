import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Header from '../HeaderComum';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interfaces
interface Message {
  id: string;
  text: string; // conteúdo da mensagem (mapeado a partir de "mensagem")
  sender: 'mentor' | 'mentorado';
  timestamp: any; // pode ser string ou objeto Firestore Timestamp
}

interface Contact {
  id: string;
  name: string;
  profileImage?: string;
}

interface UserProfile {
  id: string;
  nome: string;
  bio?: string;
  profileImage?: string;
}

const ChatScreen: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [tipoDeUsuario, setTipoDeUsuario] = useState<string | null>(null); // "MENTOR" ou "USER"

  // Estados para o modal do perfil do contato
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalProfile, setModalProfile] = useState<UserProfile | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
//Função para iniciar as cnhamadas e grvações de áudio 
// Função para iniciar chamada
const iniciarChamada = async () => {
  if (!sessionId) {
    Alert.alert('Erro', 'Nenhuma sessão ativa encontrada.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/mentoria/plano/${sessionId}`);
    const data = await response.json();

    if (response.ok) {
      const { plano } = data; // Supondo que o backend retorne { plano: "Básico" ou "Avançado" }
      
      if (plano === 'Básico') {
        Alert.alert(
          'Plano Restrito',
          'Chamadas não são permitidas para mentorias do plano Básico.'
        );
      } else if (plano === 'Avançado') {
        // Aqui você pode adicionar a lógica para iniciar a chamada
        Alert.alert('Chamada', 'Iniciando chamada...');
        // Exemplo de chamada real:
        // navigation.navigate('VideoCallScreen', { sessionId });
      }
    } else {
      Alert.alert('Erro', 'Não foi possível verificar o plano da mentoria.');
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Erro', 'Falha ao buscar os dados do plano da mentoria.');
  }
};

  // Função auxiliar para converter timestamp (Firestore ou string) em Date
  const parseTimestamp = (timestamp: any): Date => {
    if (timestamp && timestamp._seconds) {
      return new Date(timestamp._seconds * 1000);
    }
    return new Date(timestamp);
  };

  // Recupera ID e tipo_de_usuario do AsyncStorage
  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('usuarioId');
        const storedTipo = await AsyncStorage.getItem('tipo_de_usuario'); // Espera "MENTOR" ou "USER"
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          Alert.alert('Erro', 'ID do usuário não encontrado.');
        }
        if (storedTipo) {
          setTipoDeUsuario(storedTipo.toUpperCase());
        } else {
          // Fallback temporário para teste (remova essa linha após garantir que o AsyncStorage armazene o valor)
          console.warn('tipo_de_usuario não encontrado no AsyncStorage, usando fallback "MENTOR"');
          setTipoDeUsuario("MENTOR");
        }
        console.log('UserId:', storedUserId, 'Tipo do usuário:', storedTipo);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        Alert.alert('Erro', 'Não foi possível recuperar os dados do usuário.');
      }
    };
    getUserData();
  }, []);

  // Buscar contatos usando o ID do usuário logado
  useEffect(() => {
    if (!userId) {
      setLoadingContacts(false);
      return;
    }
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/contatos/${userId}`);
        const data = await response.json();
        if (response.ok) {
          const formattedContacts = data.map((item: any) => ({
            id: item.id,
            name: item.nome || item.name,
            profileImage: item.profileImage || item.imagem || null,
          }));
          setContacts(formattedContacts);
        } else {
          Alert.alert('Erro', data.message || 'Erro ao buscar contatos.');
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível buscar os contatos.');
        console.error(error);
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchContacts();
  }, [userId]);

  // Função para verificar a sessão de mentoria ativa entre um usuário e um mentor
  const checkMentoria = async (contactId: string): Promise<string | null> => {
    try {
      let usuarioIdToSend: string | null = null;
      let mentorIdToSend: string | null = null;

      // Se o usuário logado é MENTOR, o contato é um USER (mentorando)
      if (tipoDeUsuario === 'MENTOR') {
        usuarioIdToSend = contactId;
        mentorIdToSend = userId;
      } else if (tipoDeUsuario === 'USER') {
        // Se o usuário logado é USER, o contato é um MENTOR
        usuarioIdToSend = userId;
        mentorIdToSend = contactId;
      } else {
        Alert.alert('Erro', 'Tipo de usuário não definido corretamente.');
        return null;
      }

      console.log('Verificação: Enviando -> usuarioId:', usuarioIdToSend, 'mentorId:', mentorIdToSend);

      // Primeira tentativa
      let response = await fetch(`${API_BASE_URL}/mentoria/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: usuarioIdToSend,
          mentorId: mentorIdToSend,
        }),
      });
      let data = await response.json();
      if (response.ok && data.sessaoId) {
        console.log('Sessão encontrada:', data.sessaoId);
        return data.sessaoId;
      }
      // Se não encontrar, tenta inverter os parâmetros
      console.log('Tentando inverter os parâmetros...');
      response = await fetch(`${API_BASE_URL}/mentoria/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: mentorIdToSend,
          mentorId: usuarioIdToSend,
        }),
      });
      data = await response.json();
      if (response.ok && data.sessaoId) {
        console.log('Sessão encontrada (parâmetros invertidos):', data.sessaoId);
        return data.sessaoId;
      }
      Alert.alert('Atenção', data.message || 'Nenhuma mentoria ativa com esse contato.');
      return null;
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível verificar a mentoria.');
      console.error(error);
      return null;
    }
  };

  // Ao selecionar um contato, verifica a sessão de mentoria
  const onSelectContact = async (contact: Contact) => {
    const sessao = await checkMentoria(contact.id);
    if (sessao) {
      setSessionId(sessao);
      setSelectedContact(contact);
    }
  };

  // Buscar as mensagens da sessão
  const fetchMessages = async () => {
    if (!sessionId) return;
    try {
      setLoadingMessages(true);
      const response = await fetch(`${API_BASE_URL}/chat/mensagens/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        const formattedMessages = data.map((msg: any) => ({
          id: msg.id,
          text: msg.mensagem, // mapeia o campo "mensagem" para "text"
          sender: msg.remetenteId,
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
      } else {
        Alert.alert('Erro', data.message || 'Erro ao buscar mensagens.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar as mensagens.');
      console.error(error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Buscar as mensagens sempre que o chat é aberto (quando contato e sessão estão definidos)
  useEffect(() => {
    if (selectedContact && sessionId) {
      fetchMessages();
    }
  }, [selectedContact, sessionId]);

  // Envio de mensagem
  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId || !sessionId) return;
    try {
      setSendingMessage(true);
      const response = await fetch(`${API_BASE_URL}/chat/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessaoId: sessionId,
          remetenteId: userId,
          mensagem: inputMessage,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setInputMessage('');
        fetchMessages();
      } else {
        Alert.alert('Erro', data.message || 'Erro ao enviar mensagem.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Buscar o perfil completo do contato para exibir no modal
  const openProfileModal = async (contactId: string) => {
    setModalLoading(true);
    setModalVisible(true);
    try {
      const response = await fetch(`${API_BASE_URL}/perfil/${contactId}`);
      const data = await response.json();
      if (response.ok) {
        setModalProfile(data);
      } else {
        Alert.alert('Erro', data.message || 'Erro ao buscar perfil.');
        setModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar o perfil.');
      console.error(error);
      setModalVisible(false);
    } finally {
      setModalLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Verifica se o remetente da mensagem é o usuário logado.
    const isMyMessage = item.sender === userId;
    const messageDate = parseTimestamp(item.timestamp);
    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>{messageDate.toLocaleTimeString()}</Text>
      </View>
    );
  };
  
  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => onSelectContact(item)}>
      {item.profileImage ? (
        <TouchableOpacity onPress={() => openProfileModal(item.id)}>
          <Image source={{ uri: item.profileImage }} style={styles.contactImage} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="person-circle" size={40} color="#0047AB" />
      )}
      <Text style={styles.contactName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {!selectedContact ? (
          <>
            <Header screenName="Contactos" />
            {loadingContacts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0047AB" />
                <Text style={styles.loadingText}>Carregando contatos...</Text>
              </View>
            ) : (
              <FlatList
                data={contacts}
                keyExtractor={(item) => item.id}
                renderItem={renderContact}
                contentContainerStyle={styles.contactsList}
              />
            )}
          </>
        ) : (
          <>
            <View style={styles.chatHeader}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedContact(null);
                  setSessionId(null);
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              {selectedContact.profileImage ? (
                <TouchableOpacity onPress={() => openProfileModal(selectedContact.id)}>
                  <Image source={{ uri: selectedContact.profileImage }} style={styles.chatHeaderImage} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="person-circle" size={40} color="#0047AB" />
              )}
              <Text style={styles.chatHeaderTitle}>{selectedContact.name}</Text>
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={styles.rightIcons}
                  onPress={iniciarChamada}
                >
                  <Ionicons name="call" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rightIcons}
                  onPress={iniciarChamada}
                >
                  <Ionicons name="videocam" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rightIcons}>
                  <MaterialIcons name="local-library" size={28} color="#2979FF" />
                </TouchableOpacity>
              </View>
            </View>
            {loadingMessages ? (
              <ActivityIndicator size="large" color="#0047AB" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.messagesList, { flexGrow: 1, justifyContent: 'flex-end' }]}
              />
            )}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={iniciarChamada}
              >
                <Ionicons name="mic" size={24} color="#fff" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#666"
                value={inputMessage}
                onChangeText={setInputMessage}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity style={styles.iconButton} onPress={sendMessage}>
                <Ionicons name="send" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {modalLoading ? (
                <ActivityIndicator size="large" color="#0047AB" />
              ) : modalProfile ? (
                <ScrollView contentContainerStyle={styles.modalContent}>
                  {modalProfile.profileImage && (
                    <Image source={{ uri: modalProfile.profileImage }} style={styles.modalImage} />
                  )}
                  <Text style={styles.modalName}>{modalProfile.nome}</Text>
                  {modalProfile.bio && (
                    <Text style={styles.modalBio}>{modalProfile.bio}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <Text>Perfil não disponível.</Text>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  container: { flex: 1, backgroundColor: '#e5ddd5' },
  contactsList: { padding: 20, alignItems: 'center' },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    width: '100%',
  },
  contactImage: { width: 40, height: 40, borderRadius: 20 },
  contactName: { marginLeft: 10, fontSize: 18, color: '#075E54' },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  chatHeaderTitle: {
    color: '#0047AB',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  iconButton: { marginHorizontal: 10 },
  messagesList: { padding: 10 },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  myMessage: { backgroundColor: '#cce5ff', alignSelf: 'flex-end' },
  otherMessage: { backgroundColor: '#fff', alignSelf: 'flex-start' },
  messageText: { fontSize: 16 },
  messageTime: { fontSize: 12, color: '#555', marginTop: 5, textAlign: 'right' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0047AB',
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalContent: { alignItems: 'center' },
  modalImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  modalName: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalBio: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  closeButton: {
    backgroundColor: '#0047AB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  closeButtonText: { color: '#FFF', fontSize: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 26,
    color: '#0047AB',
  },
  chatHeaderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
});

export default ChatScreen;

