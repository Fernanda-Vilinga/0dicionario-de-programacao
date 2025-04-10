import React from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import useStyles from './StylesChat';
import { ThemeContext } from 'src/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
  audioUri?: string;
}

interface ChatAreaProps {
  selectedContact: { id: string; name: string; profileImage?: string };
  sessionId: string;
  messages: Message[];
  loadingMessages: boolean;
  inputMessage: string;
  setInputMessage: (text: string) => void;
  sendMessage: () => void;
  sendAudioMessage: (uri: string) => void;
  iniciarChamada: () => void;
  voltarParaContatos: () => void; // Função para voltar à lista de contatos
  abrirModalPerfil: (contactId: string) => void; // Função para abrir o modal de perfil
  openAudioModal: () => void; // Função para abrir o modal de áudio
}

const AudioPlayer: React.FC<{ audioUri: string }> = ({ audioUri }) => {
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [loadingAudio, setLoadingAudio] = React.useState(false);
  const { theme } = React.useContext(ThemeContext);
  const styles = useStyles();

  const playPauseAudio = async () => {
    setLoadingAudio(true);
    try {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if ('isLoaded' in status && status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            setSound(null);
          }
        });
      } else {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
    }
    setLoadingAudio(false);
  };

  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return (
    <TouchableOpacity onPress={playPauseAudio} style={localStyles.audioPlayerContainer}>
      {loadingAudio ? (
        <ActivityIndicator size="small" color="#2979FF" />
      ) : (
        <View style={localStyles.waveformContainer}>
          {/* Simulação de uma onda sonora com barras */}
          <View style={localStyles.waveBar} />
          <View style={localStyles.waveBar} />
          <View style={localStyles.waveBar} />
          <View style={localStyles.waveBar} />
          <View style={localStyles.waveBar} />
          {/* Ícone sobreposto para indicar play/pause */}
          {isPlaying ? (
            <Ionicons name="pause" size={28} color="#2979FF" style={localStyles.playIcon} />
          ) : (
            <Ionicons name="play" size={28} color="#2979FF" style={localStyles.playIcon} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  audioPlayerContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
  },
  waveBar: {
    width: 4,
    height: 20,
    backgroundColor: '#2979FF',
    marginHorizontal: 1,
  },
  playIcon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -5,
    alignSelf: 'center',
  },
});
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
}) => {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);
  const navigation = useNavigation();
  const scrollRef = React.useRef<ScrollView>(null);

  const parseTimestamp = (timestamp: any): Date =>
    timestamp && timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender !== selectedContact.id;
    const messageDate = parseTimestamp(item.timestamp);
    
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage, { marginVertical: 6 }]}>
        {item.text ? (
          <Text style={[styles.messageText, { color: theme.textColor }]}>{item.text}</Text>
        ) : item.audioUri ? (
          <AudioPlayer audioUri={item.audioUri} />
        ) : null}
        <Text style={[styles.messageTime, { color: theme.textColor }]}>
          {messageDate.toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header do ChatArea */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={voltarParaContatos} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => abrirModalPerfil(selectedContact.id)}>
          {selectedContact.profileImage ? (
            <Image source={{ uri: selectedContact.profileImage }} style={styles.chatHeaderImage} />
          ) : (
            <Ionicons name="person-circle" size={40} color={theme.textColor} />
          )}
        </TouchableOpacity>

        <Text style={[styles.chatHeaderTitle, { color: theme.textColor, flex: 1, marginLeft: 10 }]}>
          {selectedContact.name}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginHorizontal: 5 }} onPress={iniciarChamada}>
            <Ionicons name="videocam" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginHorizontal: 5 }}>
            <MaterialIcons name="local-library" size={28} color="#2979FF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de mensagens */}
      {loadingMessages ? (
        <ActivityIndicator
          size="large"
          color={theme.buttonBackground}
          style={{ marginTop: 20 }}
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.messagesList, { paddingBottom: 120 }]} // Espaço para a barra fixa
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((item) => renderMessage({ item }))}
        </ScrollView>
      )}

      {/* Barra inferior para envio de mensagens (fixada) */}
      <View style={[styles.bottomBar, { position: 'absolute', bottom: 0, width: '100%' }]}>
        <TouchableOpacity style={styles.iconButton} onPress={openAudioModal}>
          <Ionicons name="mic" size={24} color={theme.buttonText} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color: theme.textColor }]}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={theme.placeholderTextColor}
          value={inputMessage}
          onChangeText={setInputMessage}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.iconButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color={theme.buttonText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};


export default ChatArea;
