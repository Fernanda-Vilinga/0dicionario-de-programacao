import React, { useState, useEffect, useContext } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from '@expo/vector-icons';
import API_BASE_URL from "src/config";
import Header from "./HeaderComum";
import { ThemeContext } from "src/context/ThemeContext";

const { width } = Dimensions.get("window");
// Regras de senha: 6-10 chars, ao menos 1 letra e 1 número
type PasswordRules = RegExp;
const PASSWORD_REGEX: PasswordRules = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,10}$/;

const ChangePasswordScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);

  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [secureNovaSenha, setSecureNovaSenha] = useState(true);
  const [secureConfirmSenha, setSecureConfirmSenha] = useState(true);

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

  // Carrega usuário logado
  useEffect(() => {
    const loadUserData = async () => {
      const uid = await AsyncStorage.getItem("usuarioId");
      setUsuarioId(uid);
    };
    loadUserData();
  }, []);

  const showModal = (title: string, message: string, callback?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalCallback(() => callback || null);
    setModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!novaSenha || !confirmSenha) {
      return showModal("Erro", "Preencha ambos os campos.");
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
    if (!usuarioId) {
      return showModal("Erro", "Usuário não autenticado.");
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
          "Sua senha foi alterada com sucesso.",
          () => {
            /* permanece na tela ou navega conforme necessidade */
          }
        );
      } else {
        showModal("Erro", data.message || "Falha ao alterar senha.");
      }
    } catch (e) {
      console.error("Erro change-password:", e);
      showModal("Erro", "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Enquanto carrega ID
  if (usuarioId === null) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: theme.backgroundColor,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.backgroundColor }]}>
      <Header screenName="Alterar Senha" />

      <View
        style={[
          styles.container,
          { backgroundColor: theme.cardBackground, shadowColor: "#000" },
        ]}
      >
        <Text style={[styles.title, { color: theme.primaryColor }]}>
          Altere sua Senha
        </Text>

        {/* Nova Senha */}
        <View
          style={[styles.inputWrapper, { borderColor: theme.borderColor }]}
        >
          <TextInput
            style={[styles.input, { color: theme.textColor }]}
            placeholder="Nova senha"
            placeholderTextColor={theme.placeholderTextColor}
            secureTextEntry={secureNovaSenha}
            selectionColor={theme.primaryColor}  // colore seleção e cursor
            value={novaSenha}
            onChangeText={setNovaSenha}
          />
    <TouchableOpacity onPress={() => setSecureNovaSenha(v => !v)}>
    <MaterialIcons
      name={secureNovaSenha ? "visibility-off" : "visibility"}
      size={24}
      color={theme.primaryColor}
    />
  </TouchableOpacity>

        </View>

        {/* Confirmar Senha */}
        <View
          style={[styles.inputWrapper, { borderColor: theme.borderColor }]}
        >
          <TextInput
            style={[styles.input, { color: theme.textColor }]}
            placeholder="Confirmar senha"
            placeholderTextColor={theme.placeholderTextColor}
            secureTextEntry={secureConfirmSenha}
            selectionColor={theme.primaryColor}  // colore seleção e cursor
            value={confirmSenha}
            onChangeText={setConfirmSenha}
          />
        
        <TouchableOpacity onPress={() => setSecureConfirmSenha(v => !v)}>
    <MaterialIcons
      name={secureConfirmSenha ? "visibility-off" : "visibility"}
      size={24}
      color={theme.primaryColor}
    />
  </TouchableOpacity>

        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBackground }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            {loading ? "Enviando..." : "Salvar"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Feedback */}
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFF",
    padding: 25,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#2979FF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "50%",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
});

export default ChangePasswordScreen;
