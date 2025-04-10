import React, { useState,useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  TextInput ,Alert,ToastAndroid
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "src/types/types";
import API_BASE_URL from "src/config";

interface UserProfile {
  email: string;
  tipo_de_usuario: string;
  // outros campos se necessário...
}

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const SettingsScreenMentor: React.FC<SettingsModalProps> = ({ isVisible, onClose }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [price, setPrice] = useState(""); // Aqui você pode adicionar uma lógica para editar o preço via TextInput em outra tela se preferir
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showModalPromocao, setShowModalPromocao] = useState(false);
 const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
   const [promotionPending, setPromotionPending] = useState(false);
  
    // Função para buscar perfil do usuário via ID
    const fetchUserProfile = async (usuarioId: string) => {
      try {
        console.log("[DEBUG] Buscando perfil do usuário com ID:", usuarioId);
        const response = await fetch(`${API_BASE_URL}/perfil/${usuarioId}`);
        const data = await response.json();
        console.log("[DEBUG] Perfil recebido:", data);
        setUserProfile(data);
      } catch (error) {
        console.error("[ERROR] Erro ao buscar perfil:", error);
        Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
      }
    };
  
    // Função para verificar se há solicitação pendente para o email do usuário
    const checkPromotionPending = async (email: string) => {
      try {
        console.log("[DEBUG] Chamando endpoint para listar solicitações...");
        const response = await fetch(`${API_BASE_URL}/auth/solicitacoes-promocao`);
        const solicitacoes = await response.json();
        console.log("[DEBUG] Solicitações recebidas:", solicitacoes);
        const pending = solicitacoes.some((sol: any) => sol.email === email && sol.status === "pendente");
        console.log("[DEBUG] Existe solicitação pendente?:", pending);
        setPromotionPending(pending);
      } catch (error) {
        console.error("[ERROR] Erro ao buscar solicitações de promoção:", error);
        Alert.alert("Erro", "Não foi possível verificar o status da promoção.");
      }
    };
  
    // Sempre que o modal de promoção for aberto, busca o perfil e checa o status da promoção.
    useEffect(() => {
      if (showModalPromocao) {
        (async () => {
          const usuarioId = await AsyncStorage.getItem("usuarioId");
          if (usuarioId) {
            await fetchUserProfile(usuarioId);
          } else {
            console.log("[DEBUG] ID do usuário não encontrado no AsyncStorage.");
          }
        })();
      }
    }, [showModalPromocao]);
  
    // Sempre que o perfil é carregado, verifica se há uma solicitação pendente.
    useEffect(() => {
      if (userProfile && userProfile.email) {
        checkPromotionPending(userProfile.email);
      }
    }, [userProfile]);
  
    // Função para solicitar promoção usando os dados do perfil
    const handleSolicitarPromocao = async () => {
      try {
        console.log("[DEBUG] Iniciando solicitação de promoção...");
  
        // Recupera o ID do usuário
        const usuarioId = await AsyncStorage.getItem("usuarioId");
  
        if (!usuarioId) {
          Alert.alert("Erro", "ID do usuário não encontrado.");
          return;
        }
  
        // Garante que o perfil já foi carregado (se não, busca novamente)
        if (!userProfile) {
          await fetchUserProfile(usuarioId);
          if (!userProfile) {
            Alert.alert("Erro", "Não foi possível recuperar os dados do perfil.");
            return;
          }
        }
  
        // Usa os dados do perfil para montar o payload
        const { email, tipo_de_usuario } = userProfile!;
        console.log("[DEBUG] Perfil para promoção:", { email, tipo_de_usuario });
        
        const normalizedTipo = tipo_de_usuario.toUpperCase();
        if (normalizedTipo !== "USER" && normalizedTipo !== "MENTOR") {
          Alert.alert("Erro", "Você já está no nível máximo (ADMIN) ou o tipo está inválido.");
          return;
        }
  
        const payload = { email, tipo_de_usuario: normalizedTipo };
        console.log("[DEBUG] Payload para solicitação:", payload);
        console.log("[DEBUG] Endpoint:", `${API_BASE_URL}/auth/solicitar-promocao`);
  
        const response = await fetch(`${API_BASE_URL}/auth/solicitar-promocao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("[DEBUG] Resposta da requisição:", response);
  
        const data = await response.json();
        console.log("[DEBUG] Dados da resposta:", data);
  
        if (response.ok) {
          ToastAndroid.show("Promoção solicitada com sucesso!", ToastAndroid.SHORT);
          console.log("[DEBUG] Promoção solicitada com sucesso.");
          setPromotionPending(true);
        } else {
          Alert.alert("Erro", data.message || "Erro ao solicitar promoção.");
        }
      } catch (error) {
        console.error("[ERROR] Erro na solicitação de promoção:", error);
        Alert.alert("Erro", "Erro inesperado ao solicitar promoção.");
      }
    };
  
  const handleLogout = async () => {
    try {
      const usuarioId = await AsyncStorage.getItem("usuarioId");
  
      if (!usuarioId) {
        console.warn("ID do usuário não encontrado!");
        return;
      } else {
        console.log("Usuário que vai sair:", usuarioId);
  
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ usuarioId }), // Envia o ID no corpo
        });
  
        const data = await response.json();
        console.log("Resposta do Logout:", data);
  
        if (!response.ok) {
          console.error("Erro no logout:", data.message);
          Alert.alert("Erro", data.message || "Erro ao sair.");
          return;
        }
  
        console.log("Logout feito com sucesso:", data.message);
      }
  
      // Após a requisição, limpar os dados de autenticação
      await AsyncStorage.multiRemove(["usuarioId", "userType"]);
  
      // Redirecionar para a tela de login
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginRegister" }],
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Alert.alert("Erro", "Erro inesperado ao sair.");
    }
  };
  

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.4}
      style={styles.modal}
    >
      <View style={styles.modalContainer}>
        <Text style={styles.title}>Configurações</Text>

        {/* Opção: Disponibilidade para Mentorias */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => {
       
            onClose();
          }}
        >
          <Ionicons name="time" size={24} color="#2979FF" />
          <Text style={styles.optionText}>Disponibilidade para Mentorias</Text>
        </TouchableOpacity>

        {/* Opção: Promoção para admin */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => setShowModalPromocao(true)}
              >
                <Ionicons name="trending-up" size={24} color="#2979FF" />
                <Text style={styles.optionText}>Promoção</Text>
              </TouchableOpacity>
        {/* Outras opções padrão */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => {
            navigation.navigate("Favoritos");
            onClose();
          }}
        >
          <Ionicons name="star" size={24} color="#2979FF" />
          <Text style={styles.optionText}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => {
            navigation.navigate("Historico");
            onClose();
          }}
        >
          <MaterialIcons name="history" size={24} color="#2979FF" />
          <Text style={styles.optionText}>Histórico</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          
          onPress={() => {
            navigation.navigate("ProfileMentor");
            
            onClose();
          }}
        >
          <Ionicons name="person" size={24} color="#2979FF" />
          <Text style={styles.optionText}>Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => {
            navigation.navigate("Sugestoes");
            onClose();
          }}
        >
          <Ionicons name="bulb" size={24} color="#2979FF" />
          <Text style={styles.optionText}>Sugestões</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => {
            navigation.navigate("Sobre");
            onClose();
          }}
        >
          <Ionicons name="information-circle" size={24} color="#2979FF" />
          <Text style={styles.optionText}>Sobre</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => {
            navigation.navigate("Definicoes");
            onClose();
          }}
        >
          <Ionicons name="settings" size={24} color="#2979FF" />
          <Text style={styles.optionText}>Definições</Text>
        </TouchableOpacity>

        {/* Botão de Logout abre o modal de confirmação */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setLogoutModalVisible(true)}
        >
          <MaterialIcons name="logout" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        {/* Botão para Fechar o Modal */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Fechar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Confirmação de Logout */}
      <Modal
        isVisible={logoutModalVisible}
        onBackdropPress={() => setLogoutModalVisible(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0.5}
        style={styles.logoutModal}
      >
        <View style={styles.logoutContainer}>
          <Text style={styles.logoutTitle}>Confirmar Logout</Text>
          <Text style={styles.logoutMessage}>Tem certeza de que deseja sair?</Text>
          <View style={styles.logoutActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setLogoutModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleLogout}
            >
              <Text style={styles.confirmText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
          <Modal
        isVisible={showModalPromocao}
        onBackdropPress={() => setShowModalPromocao(false)}
        onBackButtonPress={() => setShowModalPromocao(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0.5}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Solicitar Promoção para Admintrador</Text>
          <Text style={styles.modalText}>
  Ao se tornar Admin, você poderá gerenciar usuários, conteúdos e configurações
   da plataforma. Não poderá mais orientar outros usuários e receber solicitações 
   de mentoria como outros mentores.</Text>

      
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModalPromocao(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
      
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
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2979FF",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "transparent",
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    backgroundColor: "transparent",
    paddingVertical: 10,
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
    backgroundColor: "transparent",
  },
  closeText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "bold",
  },
  logoutModal: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoutContainer: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF3B30",
    marginBottom: 10,
    textAlign: "center",
  },
  logoutMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  logoutActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  cancelText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2979FF",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  
  cancelButtonText: {
    textAlign: "center",
    color: "#000",
  },
 
  confirmButtonText: {
    textAlign: "center",
    color: "#fff",
  },
});

export default SettingsScreenMentor;
