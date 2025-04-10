// ChatInput.tsx
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (text: string) => void;
  sendMessage: () => void;
  openAudioModal: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  openAudioModal,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <TouchableOpacity style={styles.iconButton} onPress={openAudioModal}>
        <Ionicons name="mic" size={24} color={colors.text} />
      </TouchableOpacity>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="Digite sua mensagem..."
        placeholderTextColor={colors.text}
        value={inputMessage}
        onChangeText={setInputMessage}
        onSubmitEditing={sendMessage}
      />
      <TouchableOpacity style={styles.iconButton} onPress={sendMessage}>
        <Ionicons name="send" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    height: 60,
    zIndex: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginHorizontal: 10,
  },
  iconButton: {
    marginHorizontal: 5,
  },
});

export default ChatInput;
