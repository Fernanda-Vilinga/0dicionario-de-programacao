import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  TextInput 
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "src/types/types";

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

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      console.log("Usuário deslogado!");
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginRegister" }],
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
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

        {/* Opção: Configurar Preço da Sessão */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => {
           
            onClose();
          }}
        >
          <Ionicons name="cash" size={24} color="#2979FF" />
          <Text style={styles.optionText}>Configurar Preço da Sessão</Text>
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
});

export default SettingsScreenMentor;
