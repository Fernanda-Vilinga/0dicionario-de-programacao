import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderComum from '../HeaderComum';
import { ThemeContext } from 'src/context/ThemeContext';
import { useNavigation, CommonActions } from '@react-navigation/native';
import API_BASE_URL from 'src/config';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  ResetPassword: { usuarioId: string; tipo: 'RESET' | 'CHANGE' };
  LoginRegister: undefined;
  // ... outros
};

const SettingsScreen: React.FC = () => {
  const { isDarkMode, toggleTheme, theme } = useContext(ThemeContext);
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem('usuarioId');
        setUserId(id);
      } catch (err) {
        console.error('Erro ao ler AsyncStorage:', err);
      }
    })();
  }, []);

  const toggleNotifications = () => setNotificationsEnabled(prev => !prev);

  const handleDeleteAccount = async () => {
    if (!userId) {
      Alert.alert('Erro', 'Usuário não encontrado.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/Autoremoverusuario/${userId}`, { method: 'DELETE' });
      const result = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', result.message);
        await AsyncStorage.clear();
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'LoginRegister' }] })
        );
      } else {
        Alert.alert('Erro', result.message || 'Não foi possível excluir a conta.');
      }
    } catch (err) {
      console.error('Erro excluir conta:', err);
      Alert.alert('Erro', 'Falha ao excluir conta.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>      
      <HeaderComum screenName="Definições" />

      <Text style={[styles.title, { color: theme.textColor }]}>Configurações Gerais</Text>

      <View style={styles.settingRow}>
        <Text style={[styles.settingText, { color: theme.textColor }]}>Modo Escuro</Text>
        <Switch value={isDarkMode} onValueChange={toggleTheme} />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingText, { color: theme.textColor }]}>Notificações</Text>
        <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#2979FF' }]}
        onPress={() => {
          if (userId) {
            navigation.navigate('ChangePassword');

          } else {
            Alert.alert('Erro', 'ID do usuário não encontrado.');
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.buttonText }]}>Alterar Senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Excluir Conta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40, textAlign: 'center' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  settingText: { fontSize: 18 },
  button: { padding: 15, borderRadius: 5, marginVertical: 10 },
  buttonText: { fontWeight: 'bold', textAlign: 'center' },
  deleteButton: { backgroundColor: 'red', padding: 15, borderRadius: 5, marginTop: 20 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});

export default SettingsScreen;
