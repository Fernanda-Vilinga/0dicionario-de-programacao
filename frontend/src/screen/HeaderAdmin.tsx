import React, { useEffect, useState, useContext, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
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
import { countUnreadNotifications } from "src/services/notifications";

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
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Buscar perfil do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem("usuarioId");
        if (!userId) return;
        const response = await fetch(`${API_BASE_URL}/perfil/${userId}`);
        const data = await response.json();
        if (response.ok) {
          setUser({
            nome: data.nome || data.name || "Usuário",
            profileImage: data.profileImage || null,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // Contar notificações não lidas
  useEffect(() => {
    let isActive = true;
    const loadUnread = async () => {
      try {
        const count = await countUnreadNotifications();
        if (isActive) setUnreadCount(count);
      } catch (error) {
        console.error("Erro ao contar notificações:", error);
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

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
      await AsyncStorage.multiRemove(["usuarioId", "userType"]);
      navigation.reset({ index: 0, routes: [{ name: "LoginRegister" }] });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Alert.alert("Erro", "Erro inesperado ao sair.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Esquerda: logout + nome */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenSettings ?? handleLogout}
        >
          <MaterialIcons
            name="logout"
            size={26}
            color={theme.logoutIconColor}
          />
        </TouchableOpacity>
        <Text style={styles.userName}>{user.nome}</Text>
      </View>

      {/* Título centralizado */}
      <Text style={styles.screenName} numberOfLines={1} ellipsizeMode="tail">
        {screenName}
      </Text>

      {/* Direita: notificações, biblioteca */}
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
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
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
      backgroundColor: theme.headerBackground,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 10,
    },
    screenName: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.headerTextColor,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 10,
    },
    rightIcons: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconButton: {
      position: 'relative',
      padding: 5,
      marginLeft: 10,
    },
    badgeContainer: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: '#FF3B30',
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#ffffff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    userName: {
      fontSize: 14,
      color: theme.headerTextColor,
      opacity: 0.8,
      marginLeft: 8,
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      zIndex: 1,
    },
  });

export default HeaderAdmin;
