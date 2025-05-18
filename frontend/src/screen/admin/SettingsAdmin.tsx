import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
  TouchableOpacity,
  Modal,
  Button,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderComum from '../HeaderComum';
import { ThemeContext } from 'src/context/ThemeContext';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
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
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({ title: '', message: '' });

  // converte timestamp para Date
  const parseTimestamp = (ts: any): Date => {
    if (!ts) return new Date();
    if (ts.toDate) return ts.toDate();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // busca e processa solicitações
  const fetchSolicitations = async () => {
    try {
      const resp = await axios.get<SolicitationRaw[]>(
        `${API_BASE_URL}/auth/solicitacoes-exclusao`
      );
      // filtra apenas status válidos
      const valid = resp.data.filter(
        item => item.status === 'pendente' || item.status === 'atendido'
      );
      const processed: ProcessedSolicitation[] = valid.map(item => ({
        id: item.id,
        email: item.email,
        status: item.status === 'pendente' ? 'Pendente' : 'Atendido',
        createdAt: parseTimestamp(item.criadoEm),
      }));
      setSolicitations(processed);
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
    }
  };

  // carrega userId e flag de notificações
  useEffect(() => {
    (async () => {
      try {
        const [id, flag] = await Promise.all([
          AsyncStorage.getItem('usuarioId'),
          AsyncStorage.getItem('notificationsEnabled'),
        ]);
        setUserId(id);
        setNotificationsEnabled(flag == null ? true : flag === 'true');
        if (id) {
          await fetchSolicitations();
        }
      } catch (err) {
        console.error('Erro ao inicializar:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // alterna e persiste flag de notificações
  const toggleNotifications = async () => {
    try {
      const next = !notificationsEnabled;
      setNotificationsEnabled(next);
      await AsyncStorage.setItem('notificationsEnabled', next.toString());
    } catch {
      console.error('Erro ao persistir flag de notificações');
    }
  };

  // abre modal de solicitação de exclusão
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
        message: 'Deseja solicitar exclusão da sua conta? Pode levar até 48h.',
        showCancel: true,
        onConfirm: async () => {
          setModalVisible(false);
          try {
            await axios.post(`${API_BASE_URL}/auth/solicitarexclusao`, { usuarioId: userId });
            await fetchSolicitations();
            setModalConfig({
              title: 'Enviado',
              message: 'Solicitação enviada com sucesso.',
              showCancel: false,
            });
          } catch (err: any) {
            console.error(err);
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

  if (loading) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <HeaderComum screenName="Definições Admin" />

      <Text style={[styles.title, { color: theme.textColor }]}>
        Configurações do Admin
      </Text>

      <View style={styles.settingRow}>
        <Text style={[styles.settingText, { color: theme.textColor }]}>
          Modo Escuro
        </Text>
        <Switch value={isDarkMode} onValueChange={toggleTheme} />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingText, { color: theme.textColor }]}>
          Notificações
        </Text>
        <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#2979FF' }]}
        onPress={() =>
          userId
            ? navigation.navigate('ChangePassword')
            : Alert.alert('Erro', 'ID do usuário não encontrado.')
        }
      >
        <Text style={[styles.buttonText, { color: theme.buttonText }]}>
          Alterar Senha
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: 'red' }]}
        onPress={openDeletionModal}
      >
        <Text style={[styles.buttonText, { color: '#fff' }]}>
          Solicitar Exclusão de Conta
        </Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.textColor, marginTop: 20 }]}>
        Solicitações de Exclusão
      </Text>
      <FlatList
        data={solicitations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const date = item.createdAt.toLocaleDateString('pt-BR');
          const time = item.createdAt.toLocaleTimeString('pt-BR');
          return (
            <View style={[styles.row, { borderColor: theme.textColor }]}>
              <View style={styles.info}>
                <Text style={[styles.email, { color: theme.textColor }]}>
                  {item.email}
                </Text>
                <Text style={[styles.date, { color: theme.textColor }]}>
                  Registrado em: {date} às {time}
                </Text>
              </View>
              <Text style={[styles.status, { color: theme.textColor }]}>
                {item.status}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={{ color: theme.textColor }}>Nenhuma solicitação.</Text>
        }
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
                <Button title="Confirmar" onPress={modalConfig.onConfirm} />
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
