import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Defina os tipos das telas da navegação
type RootStackParamList = {
  Loading: undefined;
  LoginRegister: undefined;
  Dashboard: undefined;
  AdminDashboard: undefined;
  MentorNavigator: undefined; // Adicionando a tela do mentor
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleLogin = () => {
    // Lógica de login
    navigation.navigate('Dashboard');
  };

  // Botão temporário para ir direto para o Admin
  const handleAdminAccess = () => {
    navigation.navigate('AdminDashboard');
  };

  // Botão temporário para ir direto para o Mentor
  const handleMentorAccess = () => {
    navigation.navigate('MentorNavigator');
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

      {/* Botão temporário para acesso ao Admin */}
      <TouchableOpacity style={styles.adminButton} onPress={handleAdminAccess}>
        <Text style={styles.adminButtonText}>Ir para Admin</Text>
      </TouchableOpacity>

      {/* Botão temporário para acesso ao Mentor */}
      <TouchableOpacity style={styles.mentorButton} onPress={handleMentorAccess}>
        <Text style={styles.mentorButtonText}>Ir para Mentor</Text>
      </TouchableOpacity>

      <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loginBox: {
    width: width * 0.4,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: '#2979FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminButton: {
    backgroundColor: '#FF5733',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  adminButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mentorButton: {
    backgroundColor: '#4CAF50', // Verde para diferenciar
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  mentorButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#004AAD',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LoginScreen;
