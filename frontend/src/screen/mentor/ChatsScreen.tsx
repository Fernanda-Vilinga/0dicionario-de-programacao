// ChatScreen.tsx
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
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../HeaderComum';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useStyles from './StylesChat';
import { ThemeContext } from 'src/context/ThemeContext';
import Contacts, { Contact } from './Contacts';
import ChatArea from './ChatArea';
import AudioRecorderModal from './Audio';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

// Interfaces
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

type SessionParam = {
  sessao?: {
    sessaoId: string;
    status: 'em_curso' | 'finalizada';
    [key: string]: any;
  };
};

type ChatScreenRouteProp = RouteProp<{ ChatScreen: SessionParam }, 'ChatScreen'>;
type UserType = 'USER' | 'MENTOR' | 'ADMIN';

const ChatScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const styles = useStyles();
  const navigation = useNavigation();
  const route = useRoute<ChatScreenRouteProp>();

  const sessaoParam = route.params?.sessao;
  const sessionStatus = sessaoParam?.status || 'em_curso';

  // States
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // loader mínimo 12s
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sessionId, setSessionId] = useState<string>(sessaoParam?.sessaoId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [userType, setUserType] = useState<UserType>('USER');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalProfile, setModalProfile] = useState<UserProfile | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [audioModalVisible, setAudioModalVisible] = useState(false);

  // Loader mínimo de 12s
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  // Carregar dados do usuário
  useEffect(() => {
    const loadUser = async () => {
      try {
        const uid = await AsyncStorage.getItem('usuarioId');
        const tipo = await AsyncStorage.getItem('tipo_de_usuario');
        if (uid) setUserId(uid);
        if (tipo) setUserType(tipo.toUpperCase() as UserType);
      } catch {
        Alert.alert('Erro', 'Não foi possível recuperar dados de usuário.');
      }
    };
    loadUser();
  }, []);

  // Buscar contatos
  useEffect(() => {
    if (!userId) {
      setLoadingContacts(false);
      return;
    }
    const fetchContacts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/contatos/${userId}`);
        const data = await res.json();
        if (res.ok) {
          const list = data.map((c: any) => ({
            id: c.id,
            name: c.nome || c.name,
            profileImage: c.profileImage || c.imagem || null,
          }));
          setContacts(list);
        } else {
          Alert.alert('Erro', data.message);
        }
      } catch {
        Alert.alert('Erro', 'Não foi possível buscar contatos.');
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchContacts();
  }, [userId]);

  // Verificar sessão de mentoria
  const checkMentoria = async (contactId: string) => {
    try {
      const body = {
        usuarioId: userType === 'USER' ? userId : contactId,
        mentorId: userType === 'MENTOR' ? userId : contactId,
      };
      let res = await fetch(`${API_BASE_URL}/mentoria/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      let json = await res.json();
      if (res.ok && json.sessaoId) return json.sessaoId;

      // Tenta inverso
      const inv = { usuarioId: body.mentorId, mentorId: body.usuarioId };
      res = await fetch(`${API_BASE_URL}/mentoria/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inv)
      });
      json = await res.json();
      if (res.ok && json.sessaoId) return json.sessaoId;

      Alert.alert('Atenção', json.message);
      return null;
    } catch {
      Alert.alert('Erro', 'Falha ao verificar mentoria.');
      return null;
    }
  };

  const handleSelectContact = async (c: Contact) => {
    const sid = await checkMentoria(c.id);
    if (sid) {
      setSessionId(sid);
      setSelectedContact(c);
    }
  };

  // Buscar mensagens
  const fetchMessages = async () => {
    if (!sessionId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/mensagens/${sessionId}`);
      const data = await res.json();
      if (res.ok) {
        const msgs: Message[] = data.map((m: any) => ({
          id: m.id,
          text: m.mensagem,
          sender: m.remetenteId,
          timestamp: m.timestamp,
          audioUri: m.audioUri
        }));
        setMessages(msgs);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch {
      Alert.alert('Erro', 'Falha ao buscar mensagens.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedContact) fetchMessages();
  }, [selectedContact, sessionId]);

  // Enviar mensagem de texto
  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessaoId: sessionId, remetenteId: userId, mensagem: inputMessage })
      });
      const json = await res.json();
      if (res.ok) {
        setInputMessage('');
        fetchMessages();
      } else {
        Alert.alert('Erro', json.message);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar.');
    }
  };

  // Enviar áudio
  const sendAudioMessage = async (uri: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/enviar-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessaoId: sessionId, remetenteId: userId, mensagem: uri })
      });
      if (res.ok) fetchMessages();
      else Alert.alert('Erro', 'Falha ao enviar áudio');
    } catch {
      Alert.alert('Erro', 'Falha no áudio');
    }
  };

  // Iniciar chamada
  const iniciarChamada = () => {
    if (!sessionId) return Alert.alert('Erro', 'Sem sessão.');
    Linking.openURL(`https://meet.jit.si/${sessionId}`);
  };

  // Modal de perfil
  const openProfileModal = async (cid: string) => {
    setModalLoading(true);
    setModalVisible(true);
    try {
      const res = await fetch(`${API_BASE_URL}/perfil/${cid}`);
      const json = await res.json();
      if (res.ok) setModalProfile(json);
      else {
        Alert.alert('Erro', json.message);
        setModalVisible(false);
      }
    } catch {
      Alert.alert('Erro', 'Falha perfil');
      setModalVisible(false);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.keyboardContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.container}>
        {!selectedContact ? (
          <>
            <Header screenName="Contactos" />
            <Contacts
              contacts={contacts}
              loading={loadingContacts || initialLoading}
              onSelectContact={handleSelectContact}
              onOpenProfile={openProfileModal}
            />
          </>
        ) : (
          <ChatArea
            selectedContact={selectedContact}
            sessionId={sessionId}
            messages={messages}
            loadingMessages={loadingMessages}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            sendMessage={sendMessage}
            sendAudioMessage={sendAudioMessage}
            iniciarChamada={iniciarChamada}
            voltarParaContatos={() => setSelectedContact(null)}
            abrirModalPerfil={openProfileModal}
            openAudioModal={() => setAudioModalVisible(true)}
            sessionStatus={sessionStatus}
            currentUserType={userType}
            currentUserId={userId}
          />
        )}

        {/* Modal de perfil */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.backgroundColor }]}>
              {modalLoading ? (
                <ActivityIndicator size="large" color={theme.buttonBackground} />
              ) : modalProfile ? (
                <ScrollView contentContainerStyle={styles.modalContent}>
                  {modalProfile.profileImage && (
                    <Image source={{ uri: modalProfile.profileImage }} style={styles.modalImage} />
                  )}
                  <Text style={[styles.modalName, { color: theme.textColor }]}>
                    {modalProfile.nome}
                  </Text>
                  {modalProfile.bio && (
                    <Text style={[styles.modalBio, { color: theme.textColor }]}>
                      {modalProfile.bio}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[styles.closeButtonText, { color: theme.buttonText }]}>
                      Fechar
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <Text style={{ color: theme.textColor }}>Perfil não disponível.</Text>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de gravação de áudio */}
        <AudioRecorderModal
          isVisible={audioModalVisible}
          onClose={() => setAudioModalVisible(false)}
          onSendAudio={sendAudioMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
