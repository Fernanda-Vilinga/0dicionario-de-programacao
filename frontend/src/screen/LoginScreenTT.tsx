import React, { useState, useEffect } from "react";
import { 
  View, TextInput, TouchableOpacity, Text, 
  StyleSheet, Dimensions, Alert 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import API_BASE_URL from 'src/config';

// Definição das telas da navegação
type RootStackParamList = {
  Loading: undefined;
  LoginRegister: undefined;
  Dashboard: undefined;
  AdminDashboard: undefined;
  MentorNavigator: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Dashboard">;

const { width } = Dimensions.get("window");

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  // Verifica se há um token salvo e direciona para a home correta
  const checkUserLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userType = (await AsyncStorage.getItem("userType"))?.trim().toUpperCase();

      console.log("Usuário logado anteriormente:", userType);

      if (token && userType) {
        navigateToHome(userType);
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

      if (response.ok && data.userType) {
        const normalizedUserType = data.userType.trim().toUpperCase();

        await AsyncStorage.removeItem("userType");
        await AsyncStorage.setItem("userToken", data.token);
        await AsyncStorage.setItem("userType", normalizedUserType);

        console.log("Usuário salvo no AsyncStorage:", normalizedUserType);
        navigateToHome(normalizedUserType);
      } else {
        Alert.alert("Erro no login", data.message || "Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      Alert.alert("Erro", "Falha na conexão com o servidor.");
    }
  };

  const navigateToHome = (userType: string) => {
    const normalizedType = userType.trim().toUpperCase();

    console.log("Tipo de usuário detectado:", normalizedType);

    if (normalizedType === "ADMIN") {
      navigation.replace("AdminDashboard");
    } else if (normalizedType === "MENTOR") {
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
    width: width * 0.4,
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
