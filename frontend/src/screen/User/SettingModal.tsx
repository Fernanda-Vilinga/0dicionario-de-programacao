import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "src/types/types";

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const SettingModal: React.FC<SettingsModalProps> = ({ isVisible, onClose }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
            navigation.navigate("Perfil");
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

        {/* ✅ Nova opção "Definições" */}
        <TouchableOpacity 
          style={styles.option} 
          onPress={() => {
            navigation.navigate("Definicoes"); // Nome da rota da tela de configurações
            onClose();
          }}
        >
          <Ionicons name="settings" size={24} color="#2979FF" />
          <Text style={styles.optionText}>Definições</Text>
        </TouchableOpacity>

        {/* Botão de fechar */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Fechar</Text>
        </TouchableOpacity>
      </View>
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
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  closeButton: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});

export default SettingModal;
