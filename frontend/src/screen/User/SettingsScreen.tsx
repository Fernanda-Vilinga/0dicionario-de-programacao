import React, { useContext } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import HeaderComum from '../HeaderComum';
import { ThemeContext } from 'src/context/ThemeContext';

const SettingsScreen = () => {
  const { isDarkMode, toggleTheme, theme } = useContext(ThemeContext);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const toggleNotifications = () => setNotificationsEnabled((prev) => !prev);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir Conta",
      "Tem certeza de que deseja excluir sua conta? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", onPress: () => console.log("Conta excluída"), style: "destructive" }
      ]
    );
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


      <TouchableOpacity style={[styles.button, { backgroundColor: '#2979FF' }]}>
  <Text style={[styles.buttonText, { color: theme.buttonText }]}>
    Alterar Senha
  </Text>
</TouchableOpacity>


      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Excluir Conta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  settingText: { fontSize: 18 },
  button: { padding: 15, borderRadius: 5, marginVertical: 10 },
  buttonText: { fontWeight: 'bold', textAlign: 'center' },
  deleteButton: { backgroundColor: 'red', padding: 15, borderRadius: 5, marginTop: 20 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' }
});

export default SettingsScreen;
