import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AudioPlayer from './Player'; // Certifique-se de que este é o caminho correto para o seu AudioPlayer

interface AudioRecorderModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSendAudio: (uri: string) => void;
}

const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({ isVisible, onClose, onSendAudio }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setIsRecording(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível parar a gravação.');
    }
  };

  const handleSend = () => {
    if (audioUri) {
      onSendAudio(audioUri);
      onClose();
    }
  };

  return (
    <Modal isVisible={isVisible}>
      <View style={styles.modalContainer}>
        <Text style={styles.title}>{isRecording ? 'Gravando...' : 'Grave um áudio'}</Text>
        <View style={styles.actionsContainer}>
          {!isRecording ? (
            <TouchableOpacity onPress={startRecording}>
              <Ionicons name="mic" size={50} color="#007AFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={stopRecording}>
              <Ionicons name="stop-circle" size={50} color="red" />
            </TouchableOpacity>
          )}
        </View>
        {audioUri && (
          <View style={styles.previewContainer}>
            {/* Em vez de exibir a URL, renderiza o AudioPlayer com a onda sonora */}
            <AudioPlayer audioUri={audioUri} />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Ionicons name="send" size={24} color="#fff" />
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  previewContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginTop: 10,
  },
  sendButtonText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
 
});

export default AudioRecorderModal;
