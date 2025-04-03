import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native";

interface HeaderProps {
  screenName: string; // Nome da tela a ser exibido
}

const Header: React.FC<HeaderProps> = ({ screenName }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  // Atualizando a configuração do StatusBar
  useEffect(() => {
    StatusBar.setBarStyle('dark-content'); // Ou 'light-content' dependendo do tema
    StatusBar.setBackgroundColor(colors.card); // Usar a cor de fundo do cabeçalho
  }, [colors.card]);

  // Estilos dinâmicos para o container e título
  const dynamicStyles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 10, // Ajusta o padding para Android
      backgroundColor: colors.card, // Altera conforme o tema
    },
    screenName: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text, // Altera conforme o tema
    },
  });

  // Estilos estáticos para ícones
  const staticStyles = StyleSheet.create({
    iconLeft: {
      padding: 5,
    },
    rightIcons: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconRight: {
      paddingHorizontal: 5,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Ícone de Voltar */}
      <TouchableOpacity style={staticStyles.iconLeft} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Nome da Tela */}
      <Text style={dynamicStyles.screenName}>{screenName}</Text>

      <View style={staticStyles.rightIcons}>
        {/* Ícone de Biblioteca com cor estática */}
        <TouchableOpacity style={staticStyles.iconRight}>
          <MaterialIcons name="local-library" size={28} color="#2979FF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
