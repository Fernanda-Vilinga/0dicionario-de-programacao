import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from 'src/context/ThemeContext';
import Header from '../HeaderComum';

interface SessaoMentoria {
  sessaoId: string;
  usuarioId: string;
  data: string;
  horario: string;
  planoMentoria: string;
  categoria: string;
  status: string;
  motivoRejeicao?: string;
  motivoCancelamento?: string;
  avaliacao?: {
    nota: number;
    comentario?: string;
    data?: string;
    avaliadorId?: string;
  };
}

const { height: windowHeight } = Dimensions.get('window');

const UserSessionsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [sessions, setSessions] = useState<SessaoMentoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCancel, setLoadingCancel] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);

  // Carrega ID do usuário
  useEffect(() => {
    AsyncStorage.getItem('usuarioId').then(id => {
      if (id) setUsuarioId(id);
      else Alert.alert('Erro', 'Usuário não identificado.');
    });
  }, []);

  // Busca sessões
  useEffect(() => {
    if (!usuarioId) return;
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/mentoria/minhas-sessoes`, { params: { usuarioId } })
      .then(res => {
        const sessoes: SessaoMentoria[] = res.data.sessoes.map((doc: any) => ({
          sessaoId: doc.id || doc.sessaoId,
          usuarioId: doc.usuarioId,
          data: doc.data,
          horario: doc.horario,
          planoMentoria: doc.planoMentoria,
          categoria: doc.categoria,
          status: doc.status,
          motivoRejeicao: doc.motivoRejeicao,
          motivoCancelamento: doc.motivoCancelamento,
          avaliacao: doc.avaliacao,
        }));
        // Ordena cronologicamente
        sessoes.sort((a, b) =>
          new Date(`${a.data}T${a.horario}:00`).getTime() -
          new Date(`${b.data}T${b.horario}:00`).getTime()
        );
        setSessions(sessoes);
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar suas sessões.'))
      .finally(() => setLoading(false));
  }, [usuarioId]);

  // Verifica se pode cancelar (>=24h antes)
  const isCancellable = (sessao: SessaoMentoria) => {
    if (sessao.status !== 'aceita') return false;
    const diffH =
      (new Date(`${sessao.data}T${sessao.horario}:00`).getTime() - Date.now()) /
      36e5;
    return diffH >= 1;
  };

  const openCancelModal = (id: string) => {
    setSessionToCancel(id);
    setCancelModalVisible(true);
  };

  const confirmCancelMentoria = () => {
    if (!sessionToCancel) return;
    setLoadingCancel(sessionToCancel);
    axios
      .patch(`${API_BASE_URL}/mentoria/${sessionToCancel}/cancelar`, { motivo: cancelReason })
      .then(() => {
        Alert.alert('Sucesso', 'Sessão cancelada com sucesso.');
        // Recarrega
        if (usuarioId) {
          setLoading(true);
          axios
            .get(`${API_BASE_URL}/mentoria/minhas-sessoes`, { params: { usuarioId } })
            .then(res => {
              const updated = res.data.sessoes.map((doc: any) => ({ ...doc }));
              updated.sort((a: any, b: any) =>
                new Date(`${a.data}T${a.horario}:00`).getTime() -
                new Date(`${b.data}T${b.horario}:00`).getTime()
              );
              
              setSessions(updated);
            })
            .finally(() => setLoading(false));
        }
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível cancelar a sessão.'))
      .finally(() => {
        setLoadingCancel(null);
        setCancelModalVisible(false);
        setCancelReason('');
        setSessionToCancel(null);
      });
  };

  const renderSession = ({ item }: { item: SessaoMentoria }) => (
    <View style={[styles.card, { backgroundColor: theme.dashboardCardBackground, borderColor: theme.borderColor }]}>      
      {item.avaliacao && (
        <View style={[styles.avaliacaoContainer, { borderBottomColor: theme.borderColor }]}>          
          <Text style={[styles.detailText, { color: theme.textColor }]}>⭐ {item.avaliacao.nota}/5</Text>
          {item.avaliacao.comentario && <Text style={[styles.detailText, { color: theme.textColor }]}>{item.avaliacao.comentario}</Text>}
        </View>
      )}
      <Text style={[styles.dateText, { color: theme.textColor }]}>📅 {item.data}  ⏰ {item.horario}</Text>
      <Text style={[styles.detailText, { color: theme.textColor }]}>Categoria: {item.categoria}</Text>
      <Text style={[styles.statusText, { color: theme.textColor }]}>Status: {item.status}</Text>
      {item.status === 'aceita' && isCancellable(item) && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF5252' }]}
          onPress={() => openCancelModal(item.sessaoId)}
          disabled={loadingCancel === item.sessaoId}
        >
          {loadingCancel === item.sessaoId ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Cancelar</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>        
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { minHeight: windowHeight }]}>      
      <Header screenName="Minhas sessões" />

      {Platform.OS === 'web' ? (
        <View style={{ flex: 1 }}>          
          <ScrollView
            style={{ flex: 1, overflow: 'scroll' }}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator
          >
            {sessions.length ? (
              sessions.map(sess => <View key={sess.sessaoId}>{renderSession({ item: sess })}</View>)
            ) : (
              <Text style={[styles.emptyText, { color: theme.textColor }]}>Nenhuma sessão agendada.</Text>
            )}
          </ScrollView>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.sessaoId}
          renderItem={renderSession}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textColor }]}>Nenhuma sessão agendada.</Text>}
        />
      )}

      <Modal visible={cancelModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.dashboardCardBackground }]}>            
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Motivo do cancelamento</Text>
            <TextInput
              style={[styles.textInput, { color: theme.textColor, borderColor: theme.borderColor }]}
              placeholder="Digite o motivo..."
              placeholderTextColor={theme.textColor}
              value={cancelReason}
              onChangeText={setCancelReason}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#2979FF' }]} onPress={confirmCancelMentoria}>
                <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#FF5252' }]} onPress={() => setCancelModalVisible(false)}>
                <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  listContainer: { paddingBottom: 20, flexGrow: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {    
    width: '90%', maxWidth: 400, alignSelf: 'center',
    borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  avaliacaoContainer: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1 },
  dateText: { fontSize: 14, marginBottom: 4 },
  detailText: { fontSize: 14, marginBottom: 4 },
  statusText: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 16, textAlign: 'center', marginTop: 20 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', padding: 20, borderRadius: 12, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  textInput: { width: '100%', borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
});

export default UserSessionsScreen;
