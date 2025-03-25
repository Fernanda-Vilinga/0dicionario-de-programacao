import React, { useEffect, useState } from "react";
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Image, 
  StatusBar, 
  Platform,
  Alert
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
  const [user, setUser] = useState<{ nome: string; profileImage: string | null }>({
    nome: "Carregando...",
    profileImage: null,
  });
  const [notificationCount, setNotificationCount] = useState(0);

  // Registro para notificações push
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
        // Envie o token para o backend se necessário.
      } catch (error) {
        console.error('Erro no registro de notificações:', error);
      }
    };

    registerForPushNotificationsAsync();
  }, []);

  // Listener para notificações recebidas (in-app)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
      // Incrementa o contador de notificações para exibir um badge
      setNotificationCount(prev => prev + 1);
    });
    return () => subscription.remove();
  }, []);

  // Buscar o usuário logado
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await AsyncStorage.getItem("usuarioId");
        if (!userData) {
          console.log("Nenhum ID de usuário encontrado no AsyncStorage.");
          return;
        }
        console.log("Buscando perfil para ID:", userData);
        const response = await fetch(`${API_BASE_URL}/perfil/${userData}`);
        const data = await response.json();
        if (response.ok) {
          console.log("Dados do usuário recebidos:", data);
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

  return (
    <View style={styles.container}>
      {/* Foto e Nome do Usuário */}
      <View style={styles.userContainer}>
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.userImage} />
        ) : (
          <Ionicons name="person-circle" size={40} color="gray" />
        )}
        <Text style={styles.userName}>{user.nome}</Text>
      </View>

      {/* Nome da Tela */}
      <Text style={styles.screenName} numberOfLines={1} ellipsizeMode="tail">
        {screenName}
      </Text>

      {/* Ícones de Menu, Notificações e Biblioteca */}
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.icon} onPress={onOpenSettings}>
          <Ionicons name="menu" size={26} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.icon}>
          <Ionicons name="notifications-sharp" size={26} color="black" />
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
    color: "#2979FF",
  },
  screenName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2979FF",
    flex: 1,
    textAlign: "center",
    maxWidth: "50%",
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
    position: 'absolute',
    right: 0,
    top: -2,
    backgroundColor: 'red',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HeaderHome;
