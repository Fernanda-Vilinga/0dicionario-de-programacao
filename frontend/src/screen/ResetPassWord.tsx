import React, { useState, useContext } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import API_BASE_URL from "src/config";
import Header from "./HeaderComum";
import { ThemeContext } from "src/context/ThemeContext";

type RootStackParamList = {
  ResetPassword: { usuarioId: string };
  LoginRegister: undefined;
};

type ResetPasswordRouteProp = RouteProp<RootStackParamList, "ResetPassword">;
type ResetPasswordNavProp = StackNavigationProp<RootStackParamList, "LoginRegister">;

const { width } = Dimensions.get("window");
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,10}$/;

const ResetPasswordScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  const route = useRoute<ResetPasswordRouteProp>();
  const navigation = useNavigation<ResetPasswordNavProp>();
  const { usuarioId } = route.params;

  const showModal = (title: string, message: string, callback?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalCallback(() => callback || null);
    setModalVisible(true);
  };

  const handleResetPassword = async () => {
    if (!novaSenha || !confirmSenha) {
      return showModal("Erro", "Preencha ambos os campos de senha.");
    }
    if (!PASSWORD_REGEX.test(novaSenha)) {
      return showModal(
        "Senha inválida",
        "A senha deve ter de 6 a 10 caracteres e conter ao menos 1 letra e 1 número."
      );
    }
    if (novaSenha !== confirmSenha) {
      return showModal("Erro", "As senhas não coincidem.");
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, novaSenha }),
      });
      const data = await response.json();

      if (response.ok) {
        showModal(
          "Sucesso",
          "Senha redefinida com sucesso.",
          () => navigation.replace("LoginRegister")
        );
      } else {
        showModal("Erro", data.message || "Erro ao redefinir a senha.");
      }
    } catch (err) {
      console.error("Erro reset-password:", err);
      showModal("Erro", "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.backgroundColor }]}>      
      <Header screenName="Redefinir Senha" />
      <View style={[styles.container, { backgroundColor: theme.cardBackground, shadowColor: theme.cardShadow }]}>        
        <Text style={[styles.title, { color: theme.primaryColor }]}>Redefinir Senha</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.borderColor, color: theme.textColor }]}
          placeholder="Nova senha"
          placeholderTextColor={theme.placeholderTextColor}
          secureTextEntry
          value={novaSenha}
          onChangeText={setNovaSenha}
        />
        <TextInput
          style={[styles.input, { borderColor: theme.borderColor, color: theme.textColor }]}
          placeholder="Confirmar senha"
          placeholderTextColor={theme.placeholderTextColor}
          secureTextEntry
          value={confirmSenha}
          onChangeText={setConfirmSenha}
        />
        {confirmSenha && novaSenha !== confirmSenha && (
          <Text style={styles.errorText}>As senhas não coincidem.</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Confirmar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Erros/Sucesso */}
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
              onPress={() => {
                setModalVisible(false);
                modalCallback && modalCallback();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    width: width * 0.9,
    alignSelf: "center",
    marginTop: "10%",
    padding: 20,
    borderRadius: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "transparent",
    marginBottom: 10,
  },
  errorText: {
    color: '#FF3333',
    marginBottom: 10,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#2979FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#2979FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '50%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ResetPasswordScreen;
