import React, { useEffect, useState, useMemo, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1️⃣ Carrega perfil do usuário
  useEffect(() => {
    (async () => {
      try {
        const userId = await AsyncStorage.getItem("usuarioId");
        if (!userId) return;
        const resp = await fetch(`${API_BASE_URL}/perfil/${userId}`);
        const data = await resp.json();
        if (resp.ok) {
          setUser({
            nome: data.nome || data.name || "Usuário",
            profileImage: data.profileImage || null,
          });
        }
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
      }
    })();
  }, []);

  // 2️⃣ Carrega flag de notificações
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("notificationsEnabled");
        setNotificationsEnabled(stored == null ? true : stored === "true");
      } catch (err) {
        console.error("Erro ao ler flag de notificações:", err);
      }
    })();
  }, []);

  // 3️⃣ Conta notificações não lidas (só se habilitado)
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!notificationsEnabled) {
        if (active) setUnreadCount(0);
        return;
      }
      try {
        const count = await countUnreadNotifications();
        if (active) setUnreadCount(count);
      } catch (err) {
        console.error("Erro ao contar notificações:", err);
      }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [notificationsEnabled]);

  // 4️⃣ Logout
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
      // atualiza estado online/offline no seu backend, se necessário
      await AsyncStorage.multiRemove(["usuarioId", "userType", "notificationsEnabled"]);
      navigation.reset({ index: 0, routes: [{ name: "LoginRegister" }] });
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
      Alert.alert("Erro", "Erro inesperado ao sair.");
    }
  };

  // 5️⃣ Ao tocar no sino
  const handleNotificationsPress = () => {
    if (!notificationsEnabled) {
      Alert.alert("Notificações desativadas");
      return;
    }
    navigation.navigate("Notifications");
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenSettings ?? handleLogout}
        >
          <MaterialIcons name="logout" size={26} color={theme.logoutIconColor} />
        </TouchableOpacity>
        <Text style={styles.userName}>{user.nome}</Text>
      </View>

      <Text style={styles.screenName} numberOfLines={1} ellipsizeMode="tail">
        {screenName}
      </Text>

      <View style={styles.rightIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNotificationsPress}
        >
          <Ionicons
            name={
              notificationsEnabled
                ? "notifications-outline"
                : "notifications-off-outline"
            }
            size={26}
            color={
              notificationsEnabled
                ? theme.notificationIconColor
                : theme.textColorSecondary
            }
          />
          {notificationsEnabled && unreadCount > 0 && (
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
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      zIndex: 1,
    },
    iconButton: {
      position: "relative",
      padding: 5,
      marginLeft: 10,
    },
    userName: {
      fontSize: 14,
      color: theme.headerTextColor,
      opacity: 0.8,
      marginLeft: 8,
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
    badgeContainer: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: "#FF3B30",
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    badgeText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "bold",
    },
  });

export default HeaderAdmin;
