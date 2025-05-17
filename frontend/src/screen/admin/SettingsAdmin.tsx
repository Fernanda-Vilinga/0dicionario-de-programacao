import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
  TouchableOpacity,
  Modal,
  Button,Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderComum from '../HeaderComum';
import { ThemeContext } from 'src/context/ThemeContext';
import axios from 'axios';
import { useNavigation} from '@react-navigation/native';
import API_BASE_URL from 'src/config';

interface SolicitationRaw {
  id: string;
  email: string;
  status: string;
  criadoEm: any;
}

interface ProcessedSolicitation {
  id: string;
  email: string;
  status: 'Pendente' | 'Atendido';
  createdAt: Date;
}

const SUPER_ADMIN_ID = 'mZkU0DJhVMqoIfychMd2';

const SettingsScreenAdmin: React.FC = () => {
  const { isDarkMode, toggleTheme, theme } = useContext(ThemeContext);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [solicitations, setSolicitations] = useState<ProcessedSolicitation[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({ title: '', message: '' });

  // Converte objetos Timestamp em Date
  const parseTimestamp = (ts: any): Date => {
    if (!ts) return new Date();
    if (typeof ts === 'object') {
      const seconds = ts.seconds ?? ts._seconds;
      if (typeof seconds === 'number') {
        return new Date(seconds * 1000);
      }
      if (ts.toDate && typeof ts.toDate === 'function') {
        return ts.toDate();
      }
    }
    // fallback para string ou número
    const date = new Date(ts);
    if (!isNaN(date.getTime())) return date;
    return new Date();
  };

  // Busca as solicitações da API e converte datas
  const fetchSolicitations = async () => {
    try {
      const resp = await axios.get<SolicitationRaw[]>(
        `${API_BASE_URL}/auth/solicitacoes-exclusao`
      );
      const processed: ProcessedSolicitation[] = resp.data.map((item) => ({
        id: item.id,
        email: item.email,
        status: (item.status === 'pendente' ? 'Pendente' : 'Atendido') as 'Pendente' | 'Atendido',
        createdAt: parseTimestamp(item.criadoEm),
      }));
      setSolicitations(processed);
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
    }
  };

  // Busca e carrega usuário logado a partir do AsyncStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const id = await AsyncStorage.getItem('usuarioId');
        if (id) {
          setUserId(id);
          console.log('Usuário logado:', id);
          await fetchSolicitations();
        } else {
          console.warn('Nenhum usuário logado encontrado.');
        }
      } catch (err) {
        console.error('Erro ao buscar usuário do AsyncStorage', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const openDeletionModal = () => {
    if (!userId) return;

    if (userId === SUPER_ADMIN_ID) {
      setModalConfig({
        title: 'Ação não permitida',
        message: 'Super admin não pode solicitar exclusão.',
        showCancel: false,
      });
    } else {
      setModalConfig({
        title: 'Confirmar Exclusão',
        message: 'Deseja solicitar a exclusão da sua conta? Isso pode levar até 48h.',
        showCancel: true,
        onConfirm: async () => {
          setModalVisible(false);
          try {
            await axios.post(
              `${API_BASE_URL}/auth/solicitar-exclusao`,
              { usuarioId: userId }
            );
            await fetchSolicitations();
            setModalConfig({
              title: 'Enviado',
              message: 'Solicitação enviada com sucesso.',
              showCancel: false,
            });
          } catch (err: any) {
            console.error('Erro ao solicitar exclusão:', err);
            setModalConfig({
              title: 'Falha',
              message: err.response?.data?.message || 'Erro no servidor.',
              showCancel: false,
            });
          }
        },
      });
    }
    setModalVisible(true);
  };

  const toggleNotifications = () => setNotificationsEnabled((p) => !p);

  if (loading) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}> 
      <HeaderComum screenName="Definições " />
      <Text style={[styles.title, { color: theme.textColor }]}>Configurações do Admin</Text>

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

      <TouchableOpacity
        style={[styles.button, { backgroundColor: 'red' }]}
        onPress={openDeletionModal}
      >
        <Text style={[styles.buttonText, { color: '#fff' }]}>Solicitar Exclusão de Conta</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.textColor, marginTop: 20 }]}>Solicitações de Exclusão</Text>
      <FlatList
        data={solicitations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const formattedDate = item.createdAt.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
          const formattedTime = item.createdAt.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          return (
            <View style={[styles.row, { borderColor: theme.textColor }]}> 
              <View style={styles.info}>
                <Text style={[styles.email, { color: theme.textColor }]}>{item.email}</Text>
                <Text style={[styles.date, { color: theme.textColor }]}>Registrado em: {formattedDate} às {formattedTime}</Text>
              </View>
              <Text style={[styles.status, { color: theme.textColor }]}>{item.status}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={{ color: theme.textColor }}>Nenhuma solicitação.</Text>}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalButtons}>
              {modalConfig.showCancel && (
                <Button title="Cancelar" onPress={() => setModalVisible(false)} />
              )}
              {modalConfig.onConfirm && (
                <Button title="Confirmar" onPress={() => modalConfig.onConfirm?.()} />
              )}
              {!modalConfig.showCancel && !modalConfig.onConfirm && (
                <Button title="OK" onPress={() => setModalVisible(false)} />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingText: { fontSize: 18 },
  button: { padding: 15, borderRadius: 5, marginVertical: 10 },
  buttonText: { fontWeight: 'bold', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  info: { flex: 1 },
  email: { fontSize: 16 },
  date: { fontSize: 12, marginTop: 4 },
  status: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { fontSize: 16, marginBottom: 20 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});

export default SettingsScreenAdmin;
