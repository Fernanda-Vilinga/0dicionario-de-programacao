// --- LoginScreen.tsx ---
import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import API_BASE_URL from "src/config";
import { MaterialIcons } from "@expo/vector-icons";

// Atualização no tipo de ResetPassword
type RootStackParamList = {
  Loading: undefined;
  LoginRegister: undefined;
  Dashboard: undefined;
  AdminDashboard: undefined;
  MentorNavigator: undefined;
  ResetPassword: { usuarioId: string; tipo: 'RESET' | 'CHANGE' };
};

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Dashboard"
>;

const { width } = Dimensions.get("window");
// cálculo de padding dinamicamente com cap de 10px
const BASE_PADDING = width * 0.03;
const MAX_PADDING = 10;
const eyePadding = BASE_PADDING > MAX_PADDING ? MAX_PADDING : BASE_PADDING;
// tamanho do ícone (pode manter fixo ou adaptar)
const ICON_SIZE = 24;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userType = (await AsyncStorage.getItem("userType")) || "";
      const usuarioId = await AsyncStorage.getItem("usuarioId");

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

      if (response.ok && data.userType && data.usuarioId) {
        const normalizedUserType = data.userType.trim().toUpperCase();

        await AsyncStorage.multiSet([
          ["userToken", data.token],
          ["userType", normalizedUserType],
          ["usuarioId", data.usuarioId],
        ]);

        // marca usuário como online
        await fetch(`${API_BASE_URL}/usuarios/${data.usuarioId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({ online: true }),
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
    if (userType === "ADMIN") {
      navigation.replace("AdminDashboard");
    } else if (userType === "MENTOR") {
      navigation.replace("MentorNavigator");
    } else {
      navigation.replace("Dashboard");
    }
  };

  const handleForgotPassword = async () => {
    if (!emailRecuperacao) {
      Alert.alert("Erro", "Digite seu email.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailRecuperacao }),
        }
      );

      const data = await response.json();

      if (response.ok && data.usuarioId) {
        setShowModal(false);
        navigation.navigate("ResetPassword", {
          usuarioId: data.usuarioId,
          tipo: "RESET",
        });
      } else {
        Alert.alert(
          "Erro",
          data.message || "Não foi possível encontrar esse email."
        );
      }
    } catch (err) {
      console.error("Erro forgot password:", err);
      Alert.alert("Erro", "Falha ao processar solicitação.");
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

<View style={styles.passwordWrapper}>
  <TextInput
    style={styles.inputSenha}
    placeholder="Senha"
    placeholderTextColor="#888"
    value={senha}
    onChangeText={setSenha}
    secureTextEntry={!showPassword}      
    autoCapitalize="none"
  />
  <TouchableOpacity
    style={[styles.eyeButton, { paddingHorizontal: eyePadding }]}
    onPress={() => setShowPassword(prev => !prev)}
  >
    <MaterialIcons
      name={showPassword ? "visibility" : "visibility-off"}
      size={ICON_SIZE}
      color="#666"
    />
  </TouchableOpacity>
</View>


      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
      >
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setShowModal(true)}>
        <Text style={styles.esqueceuText}>
          Esqueceu a palavra passe?
        </Text>
      </TouchableOpacity>

      {showModal && (
        <View style={styles.modal}>
          <Text style={{ marginBottom: 10 }}>
            Digite seu e-mail de recuperação:
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={emailRecuperacao}
            onChangeText={setEmailRecuperacao}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.loginButtonText}>Enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowModal(false)}
            style={{ marginTop: 10 }}
          >
            <Text
              style={{ color: "red", textAlign: "center" }}
            >
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    alignSelf: "center",
    marginTop: 10,
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
  
  inputSenha: {   flex: 1,
    flexShrink: 1,      // permite encolher
  minWidth: 0,        // essencial em RN para inputs dentro de flex
         padding: 12,
         fontSize: 16,
         backgroundColor: "#FFF",
       },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#FFF",
    overflow: "hidden", // impede que o ícone "vaze"
  },
  eyeButton: {
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#DDD",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
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
  esqueceuText: {
    color: "#2979FF",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  modal: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 999,
  },
});

export default LoginScreen;
