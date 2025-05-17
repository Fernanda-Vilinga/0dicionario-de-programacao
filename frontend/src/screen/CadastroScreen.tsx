// --- CadastroScreen.tsx ---
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import API_BASE_URL from 'src/config';
import { MaterialIcons } from '@expo/vector-icons';

// Definição das telas da navegação
type RootStackParamList = {
  Loading: undefined;
  LoginRegister: undefined;
  Dashboard: undefined;
};
type CadastroScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

const { width } = Dimensions.get('window');
// calcula padding do botão do olho com cap de 10px
const BASE_PADDING = width * 0.03;
const MAX_PADDING = 10;
const eyePadding = BASE_PADDING > MAX_PADDING ? MAX_PADDING : BASE_PADDING;
// tamanho do ícone
const ICON_SIZE = 24;

// Regex de validação
const EMAIL_REGEX = /^[A-Za-z]{4,20}[0-9]@gmail\.com$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,10}$/;

const CadastroScreen: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const navigation = useNavigation<CadastroScreenNavigationProp>();

  const showError = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCadastro = async () => {
    if (!nome || !email || !senha || !confirmSenha)
      return showError('Erro', 'Preencha todos os campos.');
    if (!EMAIL_REGEX.test(email))
      return showError(
        'Email inválido',
        'O email deve ter 4-20 letras, seguido de um dígito e @gmail.com'
      );
    if (!PASSWORD_REGEX.test(senha))
      return showError(
        'Senha inválida',
        'De 6 a 10 caracteres, pelo menos 1 letra e 1 número.'
      );
    if (senha !== confirmSenha)
      return showError('Erro', 'As senhas não coincidem.');

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/registeruser`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, senha }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      } else {
        showError('Erro no cadastro', data.message || 'Tente novamente mais tarde.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      showError('Erro', 'Falha ao conectar com o servidor.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        placeholderTextColor="#888"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Senha com ícone responsivo */}
      <View style={styles.passwordWrapper}>
  <TextInput
    style={styles.inputField}
    placeholder="Senha"
    placeholderTextColor="#888"
    value={senha}
    onChangeText={setSenha}
    secureTextEntry={!showSenha}
    autoCapitalize="none"
  />
  <TouchableOpacity
    style={[styles.eyeButton, { paddingHorizontal: eyePadding }]}
    onPress={() => setShowSenha(!showSenha)}
  >
    <MaterialIcons
      name={showSenha ? 'visibility' : 'visibility-off'}
      size={ICON_SIZE}
      color="#666"
    />
  </TouchableOpacity>
</View>


      {/* Confirmar senha com mesmo ajuste */}
   
      <View style={styles.passwordWrapper}>
  <TextInput
    style={styles.inputField}
    placeholder="Confirmar Senha"
    placeholderTextColor="#888"
    value={confirmSenha}
    onChangeText={setConfirmSenha}
    secureTextEntry={!showConfirm}
    autoCapitalize="none"
  />
  <TouchableOpacity
    style={[styles.eyeButton, { paddingHorizontal: eyePadding }]}
    onPress={() => setShowConfirm(!showConfirm)}
  >
    <MaterialIcons
      name={showConfirm ? 'visibility' : 'visibility-off'}
      size={ICON_SIZE}
      color="#666"
    />
  </TouchableOpacity>
</View>


      <TouchableOpacity style={styles.button} onPress={handleCadastro}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      {/* Modal de erro */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.6,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignSelf: 'center',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginBottom: 15,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    overflow: 'hidden',
  },
  inputField: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    padding: 12,
    fontSize: 16,
    color: '#000',
 
  },
 
  eyeButton: {
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#DDD',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  button: {
    backgroundColor: '#2979FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#2979FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CadastroScreen;
