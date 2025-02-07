import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

interface HeaderProps {
  screenName: string; // Nome da tela a ser exibido
}

const Header: React.FC<HeaderProps> = ({ screenName }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Ícone de Voltar */}
      <TouchableOpacity style={styles.iconLeft} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      {/* Nome da Tela */}
      <Text style={styles.screenName}>{screenName}</Text>

      <View style={styles.rightIcons}>
        {/* Ícone de Notificações */}
        

        {/* Ícone de Biblioteca */}
        <TouchableOpacity style={styles.iconRight}>
          <MaterialIcons name="local-library" size={28} color="#2979FF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF", // Azul Cobalto
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconLeft: {
    padding: 5, // Espaço reduzido para o primeiro ícone
  },
  iconMiddle: {
    paddingHorizontal: 10, // Aproximação do último ícone
  },
  iconRight: {
    paddingHorizontal: 5, // Pequeno espaçamento do meio
  },
  screenName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2979FF",
  },
});

export default Header;
