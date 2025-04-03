import React, { useEffect, useState } from "react";
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Image, 
  StatusBar, 
  Platform,
  Alert,
  SafeAreaView
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import API_BASE_URL from "src/config";
import * as Notifications from 'expo-notifications';

type RootStackParamList = {
  LoginRegister: undefined;
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
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert('Erro', 'Permissão para notificações não concedida.');
          return;
        }
        const tokenData = await Notifications.getExpoPushTokenAsync();
        console.log('Token de notificação:', tokenData.data);
      } catch (error) {
        console.error('Erro no registro de notificações:', error);
      }
    };

    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
      setNotificationCount(prev => prev + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await AsyncStorage.getItem("usuarioId");
        if (!userData) return;

        const response = await fetch(`${API_BASE_URL}/perfil/${userData}`);
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

        <Text style={[styles.screenName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
          {screenName}
        </Text>

        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.icon} onPress={onOpenSettings}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon}>
            <Ionicons name="notifications-sharp" size={26} color={colors.text} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon}>
            <MaterialIcons name="local-library" size={26} color="#2979FF" />
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
    minHeight: 60, // Altura mínima do header
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
  screenName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    maxWidth: "45%", // Ajustado para não ocupar muito espaço
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    padding: 5,
  },
  badge: {
    position: "absolute",
    right: 0,
    top: -2,
    backgroundColor: "red",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default HeaderHome;
