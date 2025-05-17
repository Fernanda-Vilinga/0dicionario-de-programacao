// --- SettingModal.tsx ---
import React, { useState, useEffect, useContext } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ToastAndroid 
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "src/types/types";
import API_BASE_URL from "src/config";
import { ThemeContext } from "src/context/ThemeContext";

interface UserProfile {
  email: string;
  tipo_de_usuario: string;
}

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const SettingModal: React.FC<SettingsModalProps> = ({ isVisible, onClose }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useContext(ThemeContext);

  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showModalPromocao, setShowModalPromocao] = useState(false);
  const [promotionPending, setPromotionPending] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Busca o perfil do usuário via ID
  const fetchUserProfile = async (usuarioId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/perfil/${usuarioId}`);
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
    }
  };

  // Verifica se há solicitação pendente para o e-mail do usuário
  const checkPromotionPending = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/solicitacoes-promocao`);
      const solicitacoes = await response.json();
      const pending = solicitacoes.some(
        (sol: any) => sol.email === email && sol.status === "pendente"
      );
      setPromotionPending(pending);
    } catch {
      Alert.alert("Erro", "Não foi possível verificar o status da promoção.");
    }
  };

  // Ao abrir modal de promoção
  useEffect(() => {
    if (showModalPromocao) {
      (async () => {
        const usuarioId = await AsyncStorage.getItem("usuarioId");
        if (usuarioId) await fetchUserProfile(usuarioId);
      })();
    }
  }, [showModalPromocao]);

  // Após carregar perfil, checa promoções
  useEffect(() => {
    if (userProfile?.email) {
      checkPromotionPending(userProfile.email);
    }
  }, [userProfile]);

  // Solicita promoção
  const handleSolicitarPromocao = async () => {
    try {
      const usuarioId = await AsyncStorage.getItem("usuarioId");
      if (!usuarioId) {
        Alert.alert("Erro", "ID do usuário não encontrado.");
        return;
      }
      if (!userProfile) {
        await fetchUserProfile(usuarioId);
        if (!userProfile) {
          Alert.alert("Erro", "Não foi possível recuperar os dados do perfil.");
          return;
        }
      }
      const { email, tipo_de_usuario } = userProfile!;
      const normalizedTipo = tipo_de_usuario.toUpperCase();
      if (normalizedTipo !== "USER" && normalizedTipo !== "MENTOR") {
        Alert.alert("Erro", "Você já está no nível máximo ou o tipo é inválido.");
        return;
      }
      const payload = { email, tipo_de_usuario: normalizedTipo };
      const response = await fetch(`${API_BASE_URL}/auth/solicitar-promocao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        ToastAndroid.show("Promoção solicitada com sucesso!", ToastAndroid.SHORT);
        setPromotionPending(true);
      } else {
        Alert.alert("Erro", data.message || "Erro ao solicitar promoção.");
      }
    } catch {
      Alert.alert("Erro", "Erro inesperado ao solicitar promoção.");
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      const usuarioId = await AsyncStorage.getItem("usuarioId");
      if (!usuarioId) return;
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Erro", data.message || "Erro ao sair.");
        return;
      }
      await AsyncStorage.multiRemove(["usuarioId", "userType", "userEmail"]);
      navigation.reset({ index: 0, routes: [{ name: "LoginRegister" }] });
    } catch {
      Alert.alert("Erro", "Erro inesperado ao sair.");
    }
  };

  // Estilos dinâmicos
  const getStyles = (themeObj: typeof theme) =>
    StyleSheet.create({
      modal: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginLeft:59
      },
      modalContainer: {
        width: "85%",
        backgroundColor: themeObj.dashboardBackground,
        padding: 20,
        borderRadius: 15,
        elevation: 10,
        shadowColor: themeObj.borderColor,
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
      },
      title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
        color: themeObj.buttonBackground,
      },
      option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: themeObj.borderColor,
      },
      optionText: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: "500",
        color: themeObj.textColor,
      },
      logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        backgroundColor: themeObj.dashboardBackground,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#FF3B30",
      },
      logoutText: {
        fontSize: 16,
        color: "#FF3B30",
        fontWeight: "bold",
        marginLeft: 10,
      },
      closeButton: {
        marginTop: 20,
        alignSelf: "center",
        backgroundColor: themeObj.buttonBackground,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
      },
      closeText: {
        fontSize: 16,
        color: themeObj.buttonText,
        fontWeight: "bold",
      },
      modalContent: {
        backgroundColor: themeObj.dashboardBackground,
        padding: 20,
        borderRadius: 20,
        width: "80%",
        alignItems: "center",
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        color: themeObj.buttonBackground,
      },
      modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
        color: themeObj.textColor,
      },
      modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
      },
      cancelButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: themeObj.tabInactiveColor,
        borderRadius: 8,
        alignItems: "center",
        marginRight: 10,
      },
      cancelButtonText: {
        color: themeObj.textColor,
        textAlign: "center",
      },
      confirmButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: "#FF3B30",
        borderRadius: 8,
        alignItems: "center",
      },
      confirmButtonText: {
        color: themeObj.buttonText,
        textAlign: "center",
      },
      disabledButton: {
        backgroundColor: "#AAA",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
      },
      disabledButtonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "bold",
      },
    });

  const styles = getStyles(theme);

  return (
    <>
      {/* Modal principal de configurações */}
      <Modal 
        isVisible={isVisible} 
        onBackdropPress={onClose} 
        animationIn="slideInUp" 
        animationOut="slideOutDown"
        style={styles.modal}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Configurações</Text>

          <TouchableOpacity
            style={styles.option}
            onPress={() => setShowModalPromocao(true)}
          >
            <Ionicons name="trending-up" size={24} color={theme.buttonBackground} />
            <Text style={styles.optionText}>Promoção</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option} 
            onPress={() => { navigation.navigate("Favoritos"); onClose(); }}
          >
            <Ionicons name="star" size={24} color={theme.buttonBackground} />
            <Text style={styles.optionText}>Favoritos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option} 
            onPress={() => { navigation.navigate("Historico"); onClose(); }}
          >
            <MaterialIcons name="history" size={24} color={theme.buttonBackground} />
            <Text style={styles.optionText}>Histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option} 
            onPress={() => { navigation.navigate("Perfil"); onClose(); }}
          >
            <Ionicons name="person" size={24} color={theme.buttonBackground} />
            <Text style={styles.optionText}>Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option} 
            onPress={() => { navigation.navigate("Sugestoes"); onClose(); }}
          >
            <Ionicons name="bulb" size={24} color={theme.buttonBackground} />
            <Text style={styles.optionText}>Sugestões</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option} 
            onPress={() => { navigation.navigate("Sobre"); onClose(); }}
          >
            <Ionicons name="information-circle" size={24} color={theme.buttonBackground} />
            <Text style={styles.optionText}>Sobre</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option} 
            onPress={() => { navigation.navigate("Definicoes"); onClose(); }}
          >
            <Ionicons name="settings" size={24} color={theme.buttonBackground} />
            <Text style={styles.optionText}>Definições</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => setLogoutModalVisible(true)}
          >
            <MaterialIcons name="logout" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal de Confirmação de Logout */}
      <Modal 
        isVisible={isLogoutModalVisible}
        onBackdropPress={() => setLogoutModalVisible(false)}
        onBackButtonPress={() => setLogoutModalVisible(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0.5}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Confirmar Logout</Text>
          <Text style={styles.modalText}>Tem certeza de que deseja sair?</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setLogoutModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleLogout}
            >
              <Text style={styles.confirmButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Solicitar Promoção */}
      <Modal
        isVisible={showModalPromocao}
        onBackdropPress={() => setShowModalPromocao(false)}
        onBackButtonPress={() => setShowModalPromocao(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0.5}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Solicitar Promoção para Mentor</Text>
          <Text style={styles.modalText}>
            Ao se tornar Mentor, você poderá orientar outros usuários e receber solicitações de mentoria. Não poderá mais solicitar mentorias como mentorado.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModalPromocao(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            {promotionPending ? (
              <TouchableOpacity style={styles.disabledButton} disabled>
                <Text style={styles.disabledButtonText}>Solicitação Pendente</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={async () => {
                  await handleSolicitarPromocao();
                  setShowModalPromocao(false);
                  onClose();
                }}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SettingModal;
