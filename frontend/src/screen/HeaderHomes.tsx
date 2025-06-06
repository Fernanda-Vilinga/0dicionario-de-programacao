// HeaderHome.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  StatusBar,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import API_BASE_URL from "src/config";
import { countUnreadNotifications } from "src/services/notifications";

type RootStackParamList = {
  LoginRegister: undefined;
  Notifications: undefined;
};

interface HeaderProps {
  screenName: string;
  onOpenSettings: () => void;
}

const HeaderHome: React.FC<HeaderProps> = ({ screenName, onOpenSettings }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const [user, setUser] = useState<{ nome: string; profileImage: string | null }>({
    nome: "Carregando...",
    profileImage: null,
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Busca o flag e então conta notificações não lidas
  const loadUnread = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("notificationsEnabled");
      const enabled = stored === null ? true : stored === "true";
      if (!enabled) {
        setUnreadCount(0);
        return;
      }
      const count = await countUnreadNotifications();
      setUnreadCount(count);
    } catch (err) {
      console.error("Erro ao contar notificações:", err);
    }
  }, []);

  useEffect(() => {
    // Busca perfil do usuário
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

    // Inicia badge e polling
    loadUnread();
    const interval = setInterval(loadUnread, 30_000);
    return () => clearInterval(interval);
  }, [loadUnread]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.userContainer}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.userImage} />
          ) : (
            <Ionicons name="person-circle" size={40} color={colors.text} />
          )}
          <Text style={[styles.userName, { color: colors.text }]}>{user.nome}</Text>
        </View>

        <View style={styles.rightIcons}>
          {/* Menu */}
          <TouchableOpacity style={styles.icon} onPress={onOpenSettings}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>

          {/* Notificações */}
          <TouchableOpacity
            style={styles.icon}
            onPress={() => navigation.navigate("Notifications")}
          >
            <View style={styles.relative}>
              <Ionicons name="notifications-sharp" size={26} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Biblioteca */}
          <TouchableOpacity style={styles.icon}>
            <MaterialIcons name="local-library" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 60,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    padding: 5,
  },
  relative: {
    position: "relative",
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

export default HeaderHome;
