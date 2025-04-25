import React, { useEffect, useState, useContext, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  Alert,
  Platform 
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import API_BASE_URL from "src/config";
import { ThemeContext } from "src/context/ThemeContext";

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
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(theme), [theme]);

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
    <View style={styles.container}>
      {/* Esquerda: logout + nome do usuário */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            if (onOpenSettings) onOpenSettings();
            else handleLogout();
          }}
        >
          <MaterialIcons
            name="logout"
            size={26}
            color={theme.logoutIconColor}
          />
        </TouchableOpacity>
        <Text style={styles.userName}>{user.nome}</Text>
      </View>
  
      {/* Título absolutamente centralizado */}
      <Text
        style={styles.screenName}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {screenName}
      </Text>
  
      {/* Direita: notificações, biblioteca... */}
      <View style={styles.rightIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={26}
            color={theme.notificationIconColor}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons
            name="local-library"
            size={26}
            color={theme.libraryIconColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
  
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: theme.headerBackground || "#FFFFFF",
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 10,
    },
    screenName: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.headerTextColor || "#2979FF",
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
    userName: {
      fontSize: 14,
      color: theme.headerTextColor || "#2979FF",
      opacity: 0.8,
      marginLeft:30
    },
    leftSection: {
      flexDirection: "row",    // alinhar logout e nome em linha
      alignItems: "center",    // centralizar verticalmente
      zIndex: 1,               // garantir que fique acima do título central
    }
    
  });

export default HeaderAdmin;
