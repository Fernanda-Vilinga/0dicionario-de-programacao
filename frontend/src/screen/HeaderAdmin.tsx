import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  Platform 
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import API_BASE_URL from "src/config";

type RootStackParamList = {
  LoginRegister: undefined;
  Notifications: undefined;
};

interface HeaderProps {
  screenName: string;
  onOpenSettings?: () => void;
}

const HeaderAdmin: React.FC<HeaderProps> = ({ screenName, onOpenSettings }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<{ nome: string; profileImage: string | null }>({
    nome: "Carregando...",
    profileImage: null,
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem("usuarioId");
        if (!userId) {
          console.log("Nenhum ID de usuário encontrado no AsyncStorage.");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/perfil/${userId}`);
        const data = await response.json();

        if (response.ok) {
          setUser({
            nome: data.nome || data.name || "Usuário",
            profileImage: data.profileImage ? data.profileImage : null,
          });
        } else {
          console.error("Erro ao carregar perfil:", data.message);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      }
    };

    fetchUserProfile();
  }, []);

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
    <View style={styles.container}>
      {/* Ícone da App à esquerda */}
      <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            if (onOpenSettings) {
              onOpenSettings();
            } else {
              handleLogout();
            }
          }}
        >
          <MaterialIcons name="logout" size={26} color="#FF3B30" />
        </TouchableOpacity>
      {/* Nome da Tela Centralizado */}
      <Text style={styles.screenName} numberOfLines={1} ellipsizeMode="tail">
        {screenName}
      </Text>

      {/* Ícones à direita: Notificações e Logout */}
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("Notifications")}>
          <Ionicons name="notifications-outline" size={26} color="#2979FF" />
        </TouchableOpacity>
       
         <TouchableOpacity style={styles.iconButton}>
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 10,
  },
  leftContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  appIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  screenName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2979FF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
});

export default HeaderAdmin;
