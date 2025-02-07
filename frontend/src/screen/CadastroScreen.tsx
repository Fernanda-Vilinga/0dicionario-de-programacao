import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Hook de navegação
import { StackNavigationProp } from '@react-navigation/stack'; // Importando o tipo de navegação

// Defina os tipos das telas da navegação
type RootStackParamList = {
  Loading: undefined;
  LoginRegister: undefined;
  Dashboard: undefined;
};

type CadastroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

const { width } = Dimensions.get('window');

const CadastroScreen = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const navigation = useNavigation<CadastroScreenNavigationProp>(); // Tipando o navigation

  const handleCadastro = () => {
    // Lógica de cadastro
    if (senha === confirmSenha) {
      // Navega para a tela Dashboard após o cadastro bem-sucedido
      navigation.navigate('Dashboard');
    } else {
      alert('As senhas não coincidem');
    }
  };

  return (
    <View style={styles.loginBox}>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        placeholderTextColor="#888"
        value={nome}
        onChangeText={setNome}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Confirmar Senha"
        placeholderTextColor="#888"
        secureTextEntry
        value={confirmSenha}
        onChangeText={setConfirmSenha}
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleCadastro}>
        <Text style={styles.loginButtonText}>Cadastrar</Text>
      </TouchableOpacity>
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
});

export default CadastroScreen;
