import React, { useState, useEffect } from 'react';
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
import HeaderHomes from '../HeaderHomes';
import SettingsScreenMentor from './SettingScreenMentor';
import axios from 'axios';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<SessaoMentoriaExtended[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<SessaoMentoriaExtended[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingAceitar, setLoadingAceitar] = useState<string | null>(null);
  const [mentorId, setMentorId] = useState<string | null>(null);
  
  // Para exibir o modal de perfil
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Perfil | null>(null);

  // Busca o mentorId (usuário logado) do AsyncStorage
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

  // Função para buscar os dados do perfil de um usuário
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

  // Função para processar sessões, adicionando nome e foto do usuário
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

  // Busca e processa as sessões (pendentes e aceitas) para o mentor
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
        // Supondo que o backend retorna um array de SessaoMentoria (com usuarioId, data, etc.)
        const pending: SessaoMentoria[] = pendingResponse.data;
        const upcoming: SessaoMentoria[] = upcomingResponse.data;
        // Processa as sessões para obter os dados do perfil do usuário solicitante
        const pendingProcessed = await processSessions(pending);
        const upcomingProcessed = await processSessions(upcoming);
        // Ordena por data (mais antiga primeiro)
        const sortByDate = (b: SessaoMentoriaExtended , a: SessaoMentoriaExtended) =>
          new Date(b.data).getTime() - new Date(a.data).getTime();

        
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

  // Abre o modal de perfil com os dados do usuário
  const abrirPerfil = (perfil: Perfil) => {
    setSelectedProfile(perfil);
    setProfileModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <HeaderHomes
          screenName="Painel do Mentor"
          onOpenSettings={() => setSettingsVisible(true)}
        />
      </View>

      {/* Próximas Sessões */}
      <Text style={styles.sectionTitle}>Próximas Sessões</Text>
      {loadingSessions ? (
        <ActivityIndicator size="large" color="#2979FF" />
      ) : upcomingSessions.length > 0 ? (
        upcomingSessions.map(sessao => (
          <View key={sessao.sessaoId} style={styles.card}>
            <Text style={styles.dateText}>📅 {sessao.data} - {sessao.horario}</Text>
            <View style={styles.sessionInfo}>
              <TouchableOpacity onPress={async () => {
                // Busca o perfil novamente para exibir detalhes completos
                const perfil = await fetchPerfil(sessao.usuarioId);
                abrirPerfil(perfil);
              }}>
                <Image 
                  source={{ uri: sessao.fotoUsuario || 'https://via.placeholder.com/50' }} 
                  style={styles.userImage} 
                />
              </TouchableOpacity>
              <View style={styles.detailsContainer}>
                <Text style={styles.userName}>{sessao.nomeUsuario}</Text>
                <Text style={styles.detailText}>Plano: {sessao.planoMentoria}</Text>
                <Text style={styles.detailText}>Categoria: {sessao.categoria}</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.sessionText}>Nenhuma sessão agendada.</Text>
      )}

      {/* Solicitações Pendentes */}
      <Text style={styles.sectionTitle}>Solicitações Pendentes</Text>
      {loadingSessions ? (
        <ActivityIndicator size="large" color="#2979FF" />
      ) : pendingSessions.length > 0 ? (
        pendingSessions.map(sessao => (
          <View key={sessao.sessaoId} style={styles.card}>
            <Text style={styles.dateText}>📅 {sessao.data} - {sessao.horario}</Text>
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
                <Text style={styles.userName}>{sessao.nomeUsuario}</Text>
                <Text style={styles.detailText}>Plano: {sessao.planoMentoria}</Text>
                <Text style={styles.detailText}>Categoria: {sessao.categoria}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => aceitarMentoria(sessao.sessaoId)}
              disabled={loadingAceitar === sessao.sessaoId}
            >
              {loadingAceitar === sessao.sessaoId ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Aceitar</Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.sessionText}>Nenhuma solicitação pendente.</Text>
      )}

      {/* Modal de Perfil do Usuário */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.profileModalContainer}>
          <View style={styles.profileModalContent}>
            {selectedProfile && (
              <>
                <Image 
                  source={{ uri: selectedProfile.profileImage || 'https://via.placeholder.com/150' }} 
                  style={styles.profileImage} 
                />
                <Text style={styles.profileName}>{selectedProfile.nome}</Text>
                <Text style={styles.profileBio}>{selectedProfile.bio || ''}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setProfileModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
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
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { backgroundColor: '#f5f5f5' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15 },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginVertical: 5, 
    borderWidth: 1, 
    borderColor: 'gray' 
  },
  dateText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  sessionInfo: { flexDirection: 'row', alignItems: 'center' },
  userImage: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  detailsContainer: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  detailText: { fontSize: 14, color: 'gray' },
  sessionText: { fontSize: 16 },
  button: { 
    backgroundColor: '#2979FF', 
    padding: 10, 
    borderRadius: 5, 
    alignItems: 'center', 
    marginTop: 10 
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  profileModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  profileModalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center', width: '80%' },
  profileImage: { width: 150, height: 150, borderRadius: 75, marginBottom: 15 },
  profileName: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  profileBio: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  closeButton: { backgroundColor: '#2979FF', padding: 10, borderRadius: 5 },
  closeButtonText: { color: 'white', fontWeight: 'bold' }
});

export default MentorDashboard;
