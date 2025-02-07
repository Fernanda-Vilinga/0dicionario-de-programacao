import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const Header = () => {
  return (
    <View style={styles.container}>
      {/* Ícone de Logout */}
      <TouchableOpacity style={styles.iconLeft}>
        <MaterialIcons name="logout" size={28} color="black" />
      </TouchableOpacity>

      <View style={styles.rightIcons}>
        {/* Ícone de Notificações */}
        <TouchableOpacity style={styles.iconMiddle}>
          <Ionicons name="notifications-sharp" size={28} color="black" />
        </TouchableOpacity>

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
});

export default Header;
