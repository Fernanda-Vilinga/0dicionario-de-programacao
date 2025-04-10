import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Image,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Header from '../HeaderComum';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useStyles from './StylesChat';
import { ThemeContext } from 'src/context/ThemeContext';
import Contacts, { Contact } from './Contacts';
import ChatArea from './ChatArea';
import AudioRecorderModal from './Audio';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
  audioUri?: string;
}

interface UserProfile {
  id: string;
  nome: string;
  bio?: string;
  profileImage?: string;
}

const ChatScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const styles = useStyles();

  // Estados gerais
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [tipoDeUsuario, setTipoDeUsuario] = useState<string | null>(null);
  // Estados do modal de perfil
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalProfile, setModalProfile] = useState<UserProfile | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  // Modal do Ã¡udio
  const [audioModalVisible, setAudioModalVisible] = useState<boolean>(false);

  // Busca dados do usuÃ¡rio
  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('usuarioId');
        const storedTipo = await AsyncStorage.getItem('tipo_de_usuario');
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          Alert.alert('Erro', 'ID do usuÃ¡rio nÃ£o encontrado.');
        }
        if (storedTipo) {
          setTipoDeUsuario(storedTipo.toUpperCase());
        } else {
          setTipoDeUsuario('MENTOR');
        }
      } catch (error) {
        Alert.alert('Erro', 'NÃ£o foi possÃ­vel recuperar os dados do usuÃ¡rio.');
      }
    };
    getUserData();
  }, []);

  // Busca os contatos
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
          const formatted = data.map((item: any) => ({
            id: item.id,
            name: item.nome || item.name,
            profileImage: item.profileImage || item.imagem || null,
          }));
          setContacts(formatted);
        } else {
          Alert.alert('Erro', data.message || 'Erro ao buscar contatos.');
        }
      } catch (error) {
        Alert.alert('Erro', 'NÃ£o foi possÃ­vel buscar os contatos.');
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchContacts();
  }, [userId]);

  // Verifica se hÃ¡ mentoria ativa entre usuÃ¡rio e contato
  const checkMentoria = async (contactId: string): Promise<string | null> => {
    try {
      let usuarioIdToSend: string | null = null;
      let mentorIdToSend: string | null = null;
      if (tipoDeUsuario === 'MENTOR') {
        usuarioIdToSend = contactId;
        mentorIdToSend = userId;
      } else if (tipoDeUsuario === 'USER') {
        usuarioIdToSend = userId;
        mentorIdToSend = contactId;
      } else {
        Alert.alert('Erro', 'Tipo de usuÃ¡rio nÃ£o definido corretamente.');
        return null;
      }
      let response = await fetch(`${API_BASE_URL}/mentoria/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuarioIdToSend, mentorId: mentorIdToSend }),
      });
      let data = await response.json();
      if (response.ok && data.sessaoId) {
        return data.sessaoId;
      }
      // Tenta a inversÃ£o se necessÃ¡rio
      response = await fetch(`${API_BASE_URL}/mentoria/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: mentorIdToSend, mentorId: usuarioIdToSend }),
      });
      data = await response.json();
      if (response.ok && data.sessaoId) {
        return data.sessaoId;
      }
      Alert.alert('AtenÃ§Ã£o', data.message || 'Nenhuma mentoria ativa com esse contato.');
      return null;
    } catch (error) {
      Alert.alert('Erro', 'NÃ£o foi possÃ­vel verificar a mentoria.');
      return null;
    }
  };

  // Ao selecionar um contato, verifica a mentoria e define o contato selecionado (ou exibe alerta)
  const onSelectContact = async (contact: Contact) => {
    try {
      const sessao = await checkMentoria(contact.id);
      if (sessao) {
        setSessionId(sessao);
        setSelectedContact(contact);
      } else {
        setTimeout(() => {
          Alert.alert('Erro', 'NÃ£o hÃ¡ uma sessÃ£o de mentoria ativa com este contato.');
        }, 0);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao verificar a sessÃ£o de mentoria.');
    }
  };

  // Busca mensagens do chat
  const fetchMessages = async () => {
    if (!sessionId) return;
    try {
      setLoadingMessages(true);
      const response = await fetch(`${API_BASE_URL}/chat/mensagens/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        const formatted = data.map((msg: any) => ({
          id: msg.id,
          text: msg.mensagem,
          sender: msg.remetenteId,
          timestamp: msg.timestamp,
          audioUri: msg.audioUri,
        }));
        setMessages(formatted);
      } else {
        Alert.alert('Erro', data.message || 'Erro ao buscar mensagens.');
      }
    } catch (error) {
      Alert.alert('Erro', 'NÃ£o foi possÃ­vel buscar as mensagens.');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Atualiza as mensagens quando hÃ¡ um contato selecionado e sessÃ£o ativa
  useEffect(() => {
    if (selectedContact && sessionId) {
      fetchMessages();
    }
  }, [selectedContact, sessionId]);

  // Envia mensagem de texto
  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId || !sessionId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/chat/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessaoId: sessionId, remetenteId: userId, mensagem: inputMessage }),
      });
      const data = await response.json();
      if (response.ok) {
        setInputMessage('');
        fetchMessages();
      } else {
        Alert.alert('Erro', data.message || 'Erro ao enviar mensagem.');
      }
    } catch (error) {
      Alert.alert('Erro', 'NÃ£o foi possÃ­vel enviar a mensagem.');
    }
  };

  // Envia mensagem de Ã¡udio
  const sendAudioMessage = async (uri: string) => {
    if (!userId || !sessionId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/chat/enviar-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessaoId: sessionId, remetenteId: userId, mensagem: uri }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', 'Ãudio enviado com sucesso.');
        fetchMessages();
      } else {
        Alert.alert('Erro', data.message || 'Erro ao enviar Ã¡udio.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar Ã¡udio.');
    }
  };

  // Inicia a chamada (ex: via Jitsi)
  const iniciarChamada = async () => {
    if (!sessionId) {
      Alert.alert('Erro', 'Nenhuma sessÃ£o ativa encontrada.');
      return;
    }
    const url = `https://meet.jit.si/${sessionId}`;
    Linking.openURL(url);
  };

  // Abre o modal do perfil do contato
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
      Alert.alert('Erro', 'NÃ£o foi possÃ­vel buscar o perfil.');
      setModalVisible(false);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.keyboardContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.container}>
        {/* Se nenhum contato estiver selecionado, exibe a lista de contatos */}
        {!selectedContact ? (
          <>
            <Header screenName="Contactos" />
            {loadingContacts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2979FF"  />
                <Text style={[styles.loadingText, { color: theme.textColor }]}>Carregando contatos...</Text>
              </View>
            ) : (
              <Contacts
                contacts={contacts}
                loading={loadingContacts}
                onSelectContact={onSelectContact}
                onOpenProfile={openProfileModal}
              />
            )}
          </>
        ) : (
          // Se houver contato selecionado e sessÃ£o ativa, renderiza o ChatArea
          <ChatArea
            selectedContact={selectedContact}
            sessionId={sessionId!}
            messages={messages}
            loadingMessages={loadingMessages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            sendMessage={sendMessage}
            sendAudioMessage={sendAudioMessage}
            iniciarChamada={iniciarChamada}
            voltarParaContatos={() => setSelectedContact(null)}
            openAudioModal={() => setAudioModalVisible(true)}  // <-- Nova prop para abrir o modal de Ã¡udio
            abrirModalPerfil={(contactId: string) => openProfileModal(contactId)}
          />
        )}

        {/* Modal do perfil */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}>
              {modalLoading ? (
                <ActivityIndicator size="large" color={theme.buttonBackground} />
              ) : modalProfile ? (
                <ScrollView contentContainerStyle={styles.modalContent}>
                  {modalProfile.profileImage && (
                    <Image source={{ uri: modalProfile.profileImage }} style={styles.modalImage} />
                  )}
                  <Text style={[styles.modalName, { color: theme.textColor }]}>{modalProfile.nome}</Text>
                  {modalProfile.bio && (
                    <Text style={[styles.modalBio, { color: theme.textColor }]}>{modalProfile.bio}</Text>
                  )}
                  <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Text style={[styles.closeButtonText, { color: theme.buttonText }]}>Fechar</Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <Text style={{ color: theme.textColor }}>Perfil nÃ£o disponÃ­vel.</Text>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal para gravaÃ§Ã£o de Ã¡udio */}
        <AudioRecorderModal
          isVisible={audioModalVisible}
          onClose={() => setAudioModalVisible(false)}
          onSendAudio={(uri: string) => {
            sendAudioMessage(uri);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen; 