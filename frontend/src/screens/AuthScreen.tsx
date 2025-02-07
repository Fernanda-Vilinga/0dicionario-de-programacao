import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:3030'; //  URL do  backend 

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [userType, setUserType] = useState<'admin' | 'user'>('user');
  const [token, setToken] = useState('');

  const handleRegister = async () => {
    const route = userType === 'admin' ? '/auth/registeradmin' : '/auth/registeruser';
    console.log({ nome, email, senha })
    try {
      const response = await axios.post(`${API_URL}${route}`, { nome, email, senha }, {
        headers: {
          "Content-Type": "application/json",
          
        }
      });
      Alert.alert('Sucesso', response.data.message);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao registrar');
    }
  };

  const handleLogin = async () => {
    try{
      const response = await axios.post(`${API_URL}/auth/login`, { email, senha });
      setToken(response.data.token);
      Alert.alert('Sucesso', `Bem-vindo, ${response.data.nome}`);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao fazer login');
    }
  };

  const handlePromoteMentor = async () => {
    if (!token) {
      Alert.alert('Erro', 'Você precisa estar logado para promover a mentor.');
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/auth/promovermentores`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Sucesso', response.data.message);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao promover mentor');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Autenticação</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Registrar como Usuário"
          onPress={() => {
            setUserType('user');
            handleRegister();
          }}
        />
        <Button
          title="Registrar como Admin"
          onPress={() => {
            setUserType('admin');
            handleRegister();
          }}
        />
      </View>

      <Button title="Login" onPress={handleLogin} />

      <Button title="Promover a Mentor" onPress={handlePromoteMentor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});

export default AuthScreen;
