import React, { useEffect, useRef, useContext, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  Modal 
} from 'react-native';
import { Ionicons ,MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from 'src/context/ThemeContext';
import API_BASE_URL from 'src/config';

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
  audioUri?: string;
}

export interface ChatAreaProps {
  selectedContact: { id: string; name: string; profileImage?: string };
  sessionId: string;
  messages: Message[];
  loadingMessages: boolean;
  inputMessage: string;
  setInputMessage: (text: string) => void;
  sendMessage: () => void;
  sendAudioMessage: (uri: string) => void;
  iniciarChamada: () => void;
  voltarParaContatos: () => void;
  abrirModalPerfil: (contactId: string) => void;
  openAudioModal: () => void;
  sessionStatus: 'em_curso' | 'finalizada';
  currentUserType: 'USER' | 'MENTOR' | 'ADMIN';
  currentUserId: string;
}

interface SessionDetails {
  categoria: string;
  data: string;
  horario: string;
  status: string;
  avaliacao?: {
    nota: number;
    comentario: string;
    avaliadorId: string;
  };
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedContact,
  sessionId,
  messages,
  loadingMessages,
  inputMessage,
  setInputMessage,
  sendMessage,
  sendAudioMessage,
  iniciarChamada,
  voltarParaContatos,
  abrirModalPerfil,
  openAudioModal,
  sessionStatus,
  currentUserType,
  currentUserId,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const { theme } = useContext(ThemeContext);

  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const fetchSession = async () => {
      setLoadingSession(true);
      try {
        const res = await fetch(`${API_BASE_URL}/mentoria/${sessionId}`);
        const data: SessionDetails = await res.json();
        setSessionDetails(data);
        if (data.avaliacao?.avaliadorId === currentUserId) {
          setRating(data.avaliacao.nota);
          setComment(data.avaliacao.comentario);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSession(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  const handleSubmitEvaluation = async () => {
    if (rating < 1) {
      Alert.alert('Avaliação', 'Por favor, atribua uma nota entre 1 e 5.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/mentoria/${sessionId}/avaliar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota: rating, comentario: comment, avaliadorId: currentUserId }),
      });
      const json = await res.json();
      if (res.ok) {
        Alert.alert('Sucesso', json.message || 'Avaliação registrada!');
        setSessionDetails(prev => prev ? { ...prev, avaliacao: { nota: rating, comentario: comment, avaliadorId: currentUserId } } : prev);
        setModalVisible(false);
      } else {
        Alert.alert('Erro', json.message || 'Falha ao avaliar.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Falha ao enviar avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender !== selectedContact.id;
    const date = item.timestamp._seconds ? new Date(item.timestamp._seconds * 1000) : new Date(item.timestamp);
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage, { marginVertical: 6 }]}>          
        {item.text ? <Text style={[styles.messageText, { color: theme.textColor }]}>{item.text}</Text> : <Text style={{ color: theme.textColor }}>[Áudio]</Text>}
        <Text style={[styles.messageTime, { color: theme.textColor }]}>{date.toLocaleTimeString()}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 , marginTop:20}}>
      {/* Header with info icon */}
      <View style={styles.chatHeader}>
  <TouchableOpacity onPress={voltarParaContatos} style={{ marginRight: 10 }}>
    <Ionicons name="arrow-back" size={24} color={theme.textColor} />
  </TouchableOpacity>
  <TouchableOpacity onPress={() => abrirModalPerfil(selectedContact.id)} style={styles.profileImageContainer}>
  {selectedContact.profileImage ? (
    <Image
      source={{ uri: selectedContact.profileImage }}
      style={styles.profileImage}
    />
  ) : (
    <Ionicons name="person-circle" size={40} color={theme.textColor} />
  )}
</TouchableOpacity>

  <Text style={[styles.chatHeaderTitle, { color: theme.textColor, flex: 1 }]}>{selectedContact.name}</Text>
      {/* Ícone de Biblioteca com cor estática */}
      <TouchableOpacity style={{ marginRight: 10 }}>
          <MaterialIcons name="local-library" size={28} color="#2979FF" />
        </TouchableOpacity>
  <TouchableOpacity onPress={() => setModalVisible(true)} style={{ marginRight: 10 }}>
    <Ionicons name="information-circle" size={24} color={theme.textColor} />
  </TouchableOpacity>
  <TouchableOpacity onPress={iniciarChamada} style={{ marginRight: 10 }}>
    <Ionicons name="videocam" size={24} color={theme.textColor} />
  </TouchableOpacity>
</View>

      {/* Messages List */}
      {loadingMessages ? (
        <ActivityIndicator size="large" color={theme.buttonBackground} style={{ marginTop: 20 }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.messagesList, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(item => renderMessage({ item }))}
        </ScrollView>
      )}

      {/* Input Bar */}
      {sessionStatus === 'em_curso' && (
        <View style={[styles.bottomBar, { position: 'absolute', bottom: 0, width: '100%' }]}>          
        
          <TextInput
            style={[styles.input, { color: theme.textColor ,backgroundColor:theme.backgroundColor}]}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={theme.placeholderTextColor}
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.iconButton} onPress={sendMessage}>
            <Ionicons name="send" size={24} color="#2979FF"  />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal for session details & evaluation */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundColor }]}>            
            {loadingSession ? <ActivityIndicator size="large" color={theme.buttonBackground}/> : (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={[styles.modalTitle, { color: theme.textColor }]}>Detalhes da Sessão</Text>
                <Text style={[styles.modalText, { color: theme.textColor }]}>Categoria: {sessionDetails?.categoria}</Text>
                <Text style={[styles.modalText, { color: theme.textColor }]}>Data: {sessionDetails?.data} às {sessionDetails?.horario}</Text>
                <Text style={[styles.modalText, { color: theme.textColor }]}>Status: {sessionDetails?.status}</Text>
                <View style={styles.divider}/>
                {sessionDetails?.avaliacao ? (
                  <>                  
                    <Text style={[styles.modalSubtitle, { color: theme.textColor }]}>Sua Avaliação</Text>
                    <Text style={[styles.modalText, { color: theme.textColor }]}>Nota: {sessionDetails.avaliacao.nota} ⭐</Text>
                    <Text style={[styles.modalText, { color: theme.textColor }]}>{sessionDetails.avaliacao.comentario}</Text>
                  </>
                ) : sessionDetails?.status === 'finalizada' && currentUserType === 'USER' ? (
                  <>                  
                    <Text style={[styles.modalSubtitle, { color: theme.textColor }]}>Avaliar Sessão</Text>
                    <View style={styles.starsContainer}>
                      {[1,2,3,4,5].map(i => (
                        <TouchableOpacity key={i} onPress={() => setRating(i)}>
                          <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={28} color="#f1c40f" />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={[styles.commentInput, { borderColor: theme.placeholderTextColor, color: theme.textColor }]}
                      placeholder="Comentário (opcional)"
                      placeholderTextColor={theme.placeholderTextColor}
                      value={comment}
                      onChangeText={setComment}
                      editable={!submitting}
                    />
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmitEvaluation} disabled={submitting}>
                      {submitting ? <ActivityIndicator color="#fff"/> : <Text style={styles.submitText}>Enviar Avaliação</Text>}
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={[styles.modalText, { color: theme.textColor }]}>Sem avaliação disponível.</Text>
                )}
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.closeButtonText, { color: theme.buttonText }]}>Fechar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#ddd' },
  chatHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
  messagesList: { padding: 10 },
  messageContainer: { padding: 10, borderRadius: 8, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: '#EEE' },
  messageText: { fontSize: 16 },
  messageTime: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd' },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
  iconButton: { padding: 8 },
  sessionInfo: { padding: 8, borderBottomWidth: 1, borderColor: '#ddd', backgroundColor: '#f9f9f9' },
  sessionText: { fontSize: 14, marginVertical: 2 },
  evaluationContainer: { padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd' },
  starsContainer: { flexDirection: 'row', marginVertical: 6 },
  commentInput: { borderWidth: 1, borderRadius: 6, padding: 8, fontSize: 14, height: 60, marginBottom: 8 },
  submitButton: { backgroundColor: '#2979FF', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginVertical: 8 },
  submitText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  modalContainer: { width:'85%', maxHeight:'80%', borderRadius:10, padding:16 },
  modalContent: { paddingBottom:20 },
  modalTitle: { fontSize:18, fontWeight:'bold', marginBottom:12 },
  modalSubtitle: { fontSize:16, fontWeight:'600', marginTop:12, marginBottom:8 },
  modalText: { fontSize:14, marginBottom:6 },
  divider: { height:1, backgroundColor:'#ccc', marginVertical:12 },
  
  profileImageContainer: {
    marginRight: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  closeButton: {
    backgroundColor: 'blue',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center'
  },
  closeButtonText: {  fontSize: 16 },
  
});

export default ChatArea;