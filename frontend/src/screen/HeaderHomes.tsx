import React, { useEffect , useState} from "react";
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

        <Text
          style={[styles.screenName, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {screenName}
        </Text>

        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.icon} onPress={onOpenSettings}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon}>
            <Ionicons name="notifications-sharp" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon}>
            <MaterialIcons name="local-library" size={26} color="#2979FF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Remova qualquer import de Notifications e hooks não utilizados
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
  screenName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    maxWidth: "45%",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    padding: 5,
  },
});

export default HeaderHome;
