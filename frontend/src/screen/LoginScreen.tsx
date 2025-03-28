import React, { useState, useEffect } from "react";
import { 
  View, TextInput, TouchableOpacity, Text, 
  StyleSheet, Dimensions, Alert 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import API_BASE_URL from "src/config";

type RootStackParamList = {
  Loading: undefined;
  LoginRegister: undefined;
  Dashboard: undefined;
  AdminDashboard: undefined;
  MentorNavigator: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Dashboard">;

const { width } = Dimensions.get("window");

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  // Verifica se há um token, tipo e usuárioId salvos e navega automaticamente
  const checkUserLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userType = (await AsyncStorage.getItem("userType")) || "";
      const usuarioId = await AsyncStorage.getItem("usuarioId"); // Pegando o ID do usuário

      console.log("Usuário logado anteriormente:", {
        userType: userType.trim().toUpperCase(),
        usuarioId,
      });

      if (token && userType.trim()) {
        navigateToHome(userType.trim().toUpperCase(), usuarioId);
      }
    } catch (error) {
      console.error("Erro ao recuperar token:", error);
    }
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();
      console.log("Resposta do servidor:", data);

      if (response.ok && data.userType && data.usuarioId) {
        const normalizedUserType = data.userType.trim().toUpperCase();

        // Salva token, userType e usuarioId no AsyncStorage
        await AsyncStorage.multiSet([
          ["userToken", data.token],
          ["userType", normalizedUserType],
          ["usuarioId", data.usuarioId],
        ]);

        console.log("Usuário salvo no AsyncStorage:", { 
          userType: normalizedUserType, 
          usuarioId: data.usuarioId 
        });
        navigateToHome(normalizedUserType, data.usuarioId);
      } else {
        Alert.alert("Erro no login", data.message || "Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      Alert.alert("Erro", "Falha na conexão com o servidor.");
    }
  };

  const navigateToHome = (userType: string, usuarioId?: string | null) => {
    console.log("Tipo de usuário detectado:", userType, "ID do usuário:", usuarioId);

    if (userType === "ADMIN") {
      navigation.replace("AdminDashboard");
    } else if (userType === "MENTOR") {
      navigation.replace("MentorNavigator");
    } else {
      navigation.replace("Dashboard");
    }
  };

  return (
    <View style={styles.loginBox}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#888"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loginBox: {
    width: width * 0.6,
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFF",
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: "#2979FF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;
