import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert, StatusBar, Platform } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  LoginRegister: undefined;
};

interface HeaderProps {
  screenName: string;
  onOpenSettings: () => void;
}

const HeaderHome: React.FC<HeaderProps> = ({ screenName, onOpenSettings }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

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
      Alert.alert("Erro", "Não foi possível fazer logout.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.icon} onPress={handleLogout}>
        <MaterialIcons name="logout" size={26} color="black" />
      </TouchableOpacity>

      <Text style={styles.screenName} numberOfLines={1} ellipsizeMode="tail">
        {screenName}
      </Text>

      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.icon} onPress={onOpenSettings}>
          <Ionicons name="menu" size={26} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.icon}>
          <Ionicons name="notifications-sharp" size={26} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.icon}>
          <MaterialIcons name="local-library" size={26} color="#2979FF" />
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 10, // Ajusta para evitar header colado no topo
  },
  icon: {
    padding: 5,
  },
  screenName: {
    fontSize: 16, 
    fontWeight: "bold",
    color: "#2979FF",
    flex: 1,
    textAlign: "center",
    maxWidth: "50%", // Evita que o nome ocupe muito espaço
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});

export default HeaderHome;

