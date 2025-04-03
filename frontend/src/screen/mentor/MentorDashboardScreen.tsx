import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal
} from 'react-native';
import { Agenda } from 'react-native-calendars';
import HeaderHomes from '../HeaderHomes';
import SettingsScreenMentor from './SettingScreenMentor';
import axios from 'axios';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from 'src/context/ThemeContext';

interface SessaoMentoria {
  sessaoId: string;
  usuarioId: string;
  data: string;           // "YYYY-MM-DD"
  horario: string;        // "HH:mm"
  planoMentoria: string;
  categoria: string;
}

interface SessaoMentoriaExtended extends SessaoMentoria {
  nomeUsuario: string;
  fotoUsuario: string | null;
}

interface Perfil {
  nome: string;
  profileImage: string | null;
  bio?: string;
  sobre?: string;
}

const MentorDashboard = () => {
  const { theme } = useContext(ThemeContext);
  
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<SessaoMentoriaExtended[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<SessaoMentoriaExtended[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingAceitar, setLoadingAceitar] = useState<string | null>(null);
  const [mentorId, setMentorId] = useState<string | null>(null);
  
  // Modal de perfil
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Perfil | null>(null);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const id = await AsyncStorage.getItem('usuarioId');
        if (id) {
          setMentorId(id);
          console.log('Mentor logado:', id);
        } else {
          console.warn('Nenhum mentor logado encontrado.');
        }
      } catch (err) {
        console.error('Erro ao buscar mentor do AsyncStorage', err);
      }
    };
    fetchUsuario();
  }, []);

  const fetchPerfil = async (usuarioId: string): Promise<Perfil> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/perfil/${usuarioId}`);
      return {
        nome: response.data.nome || response.data.name || 'Usuário',
        profileImage: response.data.profileImage || null,
        bio: response.data.bio || '',
        sobre: response.data.sobre || '',
      };
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', usuarioId, error);
      return { nome: 'Desconhecido', profileImage: null };
    }
  };

  const processSessions = async (sessions: SessaoMentoria[]): Promise<SessaoMentoriaExtended[]> => {
    return Promise.all(
      sessions.map(async (sessao) => {
        const perfil = await fetchPerfil(sessao.usuarioId);
        return {
          ...sessao,
          nomeUsuario: perfil.nome,
          fotoUsuario: perfil.profileImage,
        };
      })
    );
  };

  useEffect(() => {
    const fetchSessions = async () => {
      if (!mentorId) return;
      setLoadingSessions(true);
      try {
        const pendingResponse = await axios.get(`${API_BASE_URL}/mentoria/sessoes`, {
          params: { mentorId, status: 'pendente' }
        });
        const upcomingResponse = await axios.get(`${API_BASE_URL}/mentoria/sessoes`, {
          params: { mentorId, status: 'aceita' }
        });
        const pending: SessaoMentoria[] = pendingResponse.data;
        const upcoming: SessaoMentoria[] = upcomingResponse.data;
        const pendingProcessed = await processSessions(pending);
        const upcomingProcessed = await processSessions(upcoming);
        const sortByDate = (a: SessaoMentoriaExtended, b: SessaoMentoriaExtended) =>
          new Date(a.data).getTime() - new Date(b.data).getTime();
        setPendingSessions(pendingProcessed.sort(sortByDate));
        setUpcomingSessions(upcomingProcessed.sort(sortByDate));
      } catch (error) {
        console.error(error);
        Alert.alert('Erro', 'Não foi possível carregar as sessões.');
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [mentorId]);

  const aceitarMentoria = async (sessaoId: string) => {
    setLoadingAceitar(sessaoId);
    try {
      await axios.patch(`${API_BASE_URL}/mentoria/aceitar/${sessaoId}`);
      Alert.alert('Sucesso', 'Mentoria aceita com sucesso.');
      atualizarSessions();
    } catch (error: any) {
      console.error('Erro ao aceitar mentoria:', error);
      Alert.alert('Erro', 'Não foi possível aceitar a mentoria. Tente novamente.');
    } finally {
      setLoadingAceitar(null);
    }
  };

  const atualizarSessions = async () => {
    if (!mentorId) return;
    try {
      const pendingResponse = await axios.get(`${API_BASE_URL}/mentoria/sessoes`, {
        params: { mentorId, status: 'pendente' }
      });
      const upcomingResponse = await axios.get(`${API_BASE_URL}/mentoria/sessoes`, {
        params: { mentorId, status: 'aceita' }
      });
      const pendingProcessed = await processSessions(pendingResponse.data);
      const upcomingProcessed = await processSessions(upcomingResponse.data);
      const sortByDate = (a: SessaoMentoriaExtended, b: SessaoMentoriaExtended) =>
        new Date(a.data).getTime() - new Date(b.data).getTime();
      setPendingSessions(pendingProcessed.sort(sortByDate));
      setUpcomingSessions(upcomingProcessed.sort(sortByDate));
    } catch (error) {
      console.error(error);
    }
  };

  const abrirPerfil = (perfil: Perfil) => {
    setSelectedProfile(perfil);
    setProfileModalVisible(true);
  };

  // Preparação dos dados para a Agenda
  const [items, setItems] = useState<{ [key: string]: SessaoMentoriaExtended[] }>({});

  useEffect(() => {
    const newItems: { [key: string]: SessaoMentoriaExtended[] } = {};
    upcomingSessions.forEach(sessao => {
      if (!newItems[sessao.data]) {
        newItems[sessao.data] = [];
      }
      newItems[sessao.data].push(sessao);
    });
    setItems(newItems);
  }, [upcomingSessions]);

  const renderAgendaItem = (item: SessaoMentoriaExtended) => {
    return (
      <View style={[styles.agendaItem, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.agendaItemText, { color: theme.textColor }]}>{item.horario} - {item.nomeUsuario}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.dashboardBackground }]}>
      <View style={styles.header}>
        <HeaderHomes
          screenName="Painel do Mentor"
          onOpenSettings={() => setSettingsVisible(true)}
        />
      </View>

      {/* Área de Agenda/Calendário */}
      <Text style={[styles.sectionTitle, { color: theme.dashboardTextColor }]}>Agenda de Sessões </Text>
   
      {/* Lista Tradicional de Próximas Sessões */}
      <Text style={[styles.sectionTitle, { color: theme.dashboardTextColor }]}>Próximas Sessões</Text>
      {loadingSessions ? (
        <ActivityIndicator size="large" color="#2979FF" />
      ) : upcomingSessions.length > 0 ? (
        upcomingSessions.map(sessao => (
          <View key={sessao.sessaoId} style={[styles.card, { backgroundColor: theme.dashboardCardBackground, borderColor: theme.borderColor }]}>
            <Text style={[styles.dateText, { color: theme.textColor }]}>{`📅 ${sessao.data} - ${sessao.horario}`}</Text>
            <View style={styles.sessionInfo}>
              <TouchableOpacity onPress={async () => {
                const perfil = await fetchPerfil(sessao.usuarioId);
                abrirPerfil(perfil);
              }}>
                <Image 
                  source={{ uri: sessao.fotoUsuario || 'https://via.placeholder.com/50' }} 
                  style={styles.userImage} 
                />
              </TouchableOpacity>
              <View style={styles.detailsContainer}>
                <Text style={[styles.userName, { color: theme.textColor }]}>{sessao.nomeUsuario}</Text>
                <Text style={[styles.detailText, { color: theme.textColor }]}>Plano: {sessao.planoMentoria}</Text>
                <Text style={[styles.detailText, { color: theme.textColor }]}>Categoria: {sessao.categoria}</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={[styles.sessionText, { color: theme.textColor }]}>Nenhuma sessão agendada.</Text>
      )}

      {/* Lista de Solicitações Pendentes */}
      <Text style={[styles.sectionTitle, { color: theme.dashboardTextColor }]}>Solicitações Pendentes</Text>
      {loadingSessions ? (
        <ActivityIndicator size="large" color="#2979FF" />
      ) : pendingSessions.length > 0 ? (
        pendingSessions.map(sessao => (
          <View key={sessao.sessaoId} style={[styles.card, { backgroundColor: theme.dashboardCardBackground, borderColor: theme.borderColor }]}>
            <Text style={[styles.dateText, { color: theme.textColor }]}>{`📅 ${sessao.data} - ${sessao.horario}`}</Text>
            <View style={styles.sessionInfo}>
              <TouchableOpacity onPress={async () => {
                const perfil = await fetchPerfil(sessao.usuarioId);
                abrirPerfil(perfil);
              }}>
                <Image 
                  source={{ uri: sessao.fotoUsuario || 'https://via.placeholder.com/50' }} 
                  style={styles.userImage} 
                />
              </TouchableOpacity>
              <View style={styles.detailsContainer}>
                <Text style={[styles.userName, { color: theme.textColor }]}>{sessao.nomeUsuario}</Text>
                <Text style={[styles.detailText, { color: theme.textColor }]}>Plano: {sessao.planoMentoria}</Text>
                <Text style={[styles.detailText, { color: theme.textColor }]}>Categoria: {sessao.categoria}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#2979FF'  }]}
              onPress={() => aceitarMentoria(sessao.sessaoId)}
              disabled={loadingAceitar === sessao.sessaoId}
            >
              {loadingAceitar === sessao.sessaoId ? (
                <ActivityIndicator color="#2979FF" />
              ) : (
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>Aceitar</Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={[styles.sessionText, { color: theme.textColor }]}>Nenhuma solicitação pendente.</Text>
      )}

      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.profileModalContainer}>
          <View style={[styles.profileModalContent, { backgroundColor: theme.dashboardCardBackground }]}>
            {selectedProfile && (
              <>
                <Image 
                  source={{ uri: selectedProfile.profileImage || 'https://via.placeholder.com/150' }} 
                  style={styles.profileImage} 
                />
                <Text style={[styles.profileName, { color: theme.textColor }]}>{selectedProfile.nome}</Text>
                <Text style={[styles.profileBio, { color: theme.textColor }]}>{selectedProfile.bio || ''}</Text>
                <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.buttonBackground }]} onPress={() => setProfileModalVisible(false)}>
                  <Text style={[styles.closeButtonText, { color: theme.buttonText }]}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <SettingsScreenMentor
        isVisible={isSettingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },
  header: { 
    marginBottom: 10 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginVertical: 15 
  },
  card: { 
    borderRadius: 12, 
    padding: 20, 
    marginVertical: 10, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1
  },
  dateText: { 
    fontSize: 14, 
    marginBottom: 8 
  },
  sessionInfo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  userImage: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 15 
  },
  detailsContainer: { 
    flex: 1 
  },
  userName: { 
    fontSize: 16, 
    fontWeight: '600'
  },
  detailText: { 
    fontSize: 14, 
    marginTop: 2 
  },
  sessionText: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginVertical: 20 
  },
  button: { 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 15 
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  // Estilização da Agenda
  agendaItem: {
    padding: 15,
    marginRight: 10,
    marginTop: 17,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  agendaItemText: {
    fontSize: 14
  },
  emptyDate: {
    flex: 1,
    paddingTop: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileModalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  profileModalContent: { 
    padding: 25, 
    borderRadius: 12, 
    alignItems: 'center', 
    width: '80%' 
  },
  profileImage: { 
    width: 150, 
    height: 150, 
    borderRadius: 75, 
    marginBottom: 15 
  },
  profileName: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 10 
  },
  profileBio: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 20 
  },
  closeButton: { 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 8 
  },
  closeButtonText: { 
    fontSize: 16, 
    fontWeight: '600' 
  }
});

export default MentorDashboard;
