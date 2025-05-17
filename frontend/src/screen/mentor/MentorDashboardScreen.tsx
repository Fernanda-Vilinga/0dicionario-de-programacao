import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import HeaderHomes from '../HeaderHomes';
import SettingsScreenMentor from './SettingScreenMentor';
import axios from 'axios';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from "src/context/ThemeContext";

interface Avaliacao {
  avaliadorId: string;
  comentario?: string;
  nota: number;
  data: string;      
  categoria: string;
}

interface SessaoMentoria {
  sessaoId: string;
  usuarioId: string;
  data: string;
  horario: string;
  planoMentoria: string;
  categoria: string;
  status?: string;
  motivoRejeicao?: string;
  motivoCancelamento?: string;
  avaliacao?: Avaliacao;
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

// Função para criar estilos dinâmicos com base no tema
const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingBottom: 20,
      backgroundColor: theme.backgroundColor, // cor de fundo dinâmica
    },
    header: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginLeft: 15,
      marginTop: 20,
      marginBottom: 10,
      color: theme.textColor, // cor do título dinâmica
    },
    card: {
      backgroundColor: theme.dashboardCardBackground,
      borderRadius: 8,
      marginHorizontal: 15,
      marginBottom: 10,
      padding: 15,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    dateText: {
      fontSize: 16,
      marginBottom: 10,
      color: theme.textColorSecondary,
    },
    sessionInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    userImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
    },
    detailsContainer: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    detailText: {
      fontSize: 14,
      color: theme.textColorSecondary,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
    },
    button: {
      backgroundColor: theme.buttonBackground,
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      minWidth: 100,
    },
    buttonText: {
      color: theme.buttonText,
      fontWeight: 'bold',
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
      margin: 20,
      backgroundColor: theme.dashboardBackground,
      borderRadius: 10,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '90%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
      color: theme.textColor,
    },
    modalText: {
      marginBottom: 15,
      textAlign: 'center',
      color: theme.textColorSecondary,
    },
    modalImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 15,
    },
    input: {
      height: 40,
      borderColor: theme.borderColor,
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 10,
      borderRadius: 5,
      width: '100%',
      color: theme.textColor,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
    },
    sessionText: {
      fontSize: 16,
      marginLeft: 15,
      fontStyle: 'italic',
      color: theme.textColorSecondary,
    },
    inCourseBadge: {
      backgroundColor: '#4CAF50',
      padding: 5,
      borderRadius: 5,
      alignSelf: 'flex-start',
      marginTop: 5,
    },
    inCourseText: {
      color: theme.buttonText,
      fontWeight: 'bold',
    },
    avaliacaoContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
    },
    
  });

const MentorDashboard = () => {
  const { theme } = useContext(ThemeContext);
  // Gere estilos dinamicamente com base no tema
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<SessaoMentoriaExtended[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<SessaoMentoriaExtended[]>([]);
  const [inCourseSessions, setInCourseSessions] = useState<SessaoMentoriaExtended[]>([]);
  const [finalizedSessions, setFinalizedSessions] = useState<SessaoMentoriaExtended[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingAceitar, setLoadingAceitar] = useState<string | null>(null);
  const [loadingRejeitar, setLoadingRejeitar] = useState<string | null>(null);
  const [loadingCancelar, setLoadingCancelar] = useState<string | null>(null);
  const [mentorId, setMentorId] = useState<string | null>(null);

  // Modais e estados auxiliares
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Perfil | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [sessionToReject, setSessionToReject] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [sessionToCancel, setSessionToCancel] = useState<string | null>(null);

  // Busca o ID do mentor no AsyncStorage
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
//1
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

  // Atualiza sessões expiradas/finalizadas
  const atualizarExpiracaoFinalizacao = async () => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/mentoria/expirar-sessoes`);
      console.log('Atualização de expiração/finalização:', response.data.message);
    } catch (error) {
      console.error('Erro ao atualizar sessões expiradas/finalizadas:', error);
    }
  };

  const fetchSessions = async () => {
    if (!mentorId) return;
    setLoadingSessions(true);
    try {
      await atualizarExpiracaoFinalizacao();

      const pendingResponse = await axios.get(`${API_BASE_URL}/mentoria/sessoes`, {
        params: { mentorId, status: 'pendente' },
      });
      const upcomingResponse = await axios.get(`${API_BASE_URL}/mentoria/sessoes`, {
        params: { mentorId, status: 'aceita' },
      });
      const inCourseResponse = await axios.get(`${API_BASE_URL}/mentoria/sessoes`, {
        params: { mentorId, status: 'em_curso' },
      });
      const finalizedResponse = await axios.get(`${API_BASE_URL}/mentoria/sessoes`, {
        params: { mentorId, status: 'finalizada' },
      });

      const pending: SessaoMentoria[] = pendingResponse.data.sessoes || [];
      const upcoming: SessaoMentoria[] = upcomingResponse.data.sessoes || [];
      const inCourse: SessaoMentoria[] = inCourseResponse.data.sessoes || [];
      const finalized: SessaoMentoria[] = finalizedResponse.data.sessoes || [];

      const pendingProcessed = await processSessions(pending);
      const upcomingProcessed = await processSessions(upcoming);
      const inCourseProcessed = await processSessions(inCourse);
      const finalizedProcessed = await processSessions(finalized);

      const sortByDate = (a: SessaoMentoriaExtended, b: SessaoMentoriaExtended) =>
        new Date(a.data).getTime() - new Date(b.data).getTime();

      setPendingSessions(pendingProcessed.sort(sortByDate));
      setUpcomingSessions(upcomingProcessed.sort(sortByDate));
      setInCourseSessions(inCourseProcessed.sort(sortByDate));
      setFinalizedSessions(finalizedProcessed.sort(sortByDate));
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar as sessões.');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (mentorId) {
      fetchSessions();
    }
  }, [mentorId]);

  useEffect(() => {
    const interval = setInterval(() => {
      atualizarExpiracaoFinalizacao();
      fetchSessions();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mentorId]);

  const aceitarMentoria = async (sessaoId: string) => {
    setLoadingAceitar(sessaoId);
    try {
      await axios.patch(`${API_BASE_URL}/mentoria/${sessaoId}/aceitar`)

      Alert.alert('Sucesso', 'Mentoria aceita com sucesso.');
      fetchSessions();
    } catch (error: any) {
      console.error('Erro ao aceitar mentoria:', error);
      Alert.alert('Erro', 'Não foi possível aceitar a mentoria. Tente novamente.');
    } finally {
      setLoadingAceitar(null);
    }
  };

  const openCancelModal = (sessaoId: string) => {
    setSessionToCancel(sessaoId);
    setCancelModalVisible(true);
  };

  const confirmCancelMentoria = async () => {
    if (!sessionToCancel) return;
    setLoadingCancelar(sessionToCancel);
    try {
      await axios.patch(`${API_BASE_URL}/mentoria/${sessionToCancel}/cancelar`, { motivo: cancelReason });
      Alert.alert('Sucesso', 'Mentoria cancelada com sucesso.');
      fetchSessions();
    } catch (error: any) {
      console.error('Erro ao cancelar mentoria:', error);
      Alert.alert('Erro', 'Não foi possível cancelar a mentoria. Tente novamente.');
    } finally {
      setLoadingCancelar(null);
      setCancelModalVisible(false);
      setCancelReason('');
      setSessionToCancel(null);
    }
  };

  const rejeitarMentoria = async (sessaoId: string, motivo: string) => {
    setLoadingRejeitar(sessaoId);
    try {
      await axios.patch(`${API_BASE_URL}/mentoria/${sessaoId}/rejeitar`, { motivo })
      Alert.alert('Sucesso', 'Mentoria rejeitada com sucesso.');
      fetchSessions();
    } catch (error: any) {
      console.error('Erro ao rejeitar mentoria:', error);
      Alert.alert('Erro', 'Não foi possível rejeitar a mentoria. Tente novamente.');
    } finally {
      setLoadingRejeitar(null);
      setRejectModalVisible(false);
      setRejectionReason('');
      setSessionToReject(null);
    }
  };

  const openRejectModal = (sessaoId: string) => {
    setSessionToReject(sessaoId);
    setRejectModalVisible(true);
  };

  const confirmRejectMentoria = () => {
    if (sessionToReject) {
      rejeitarMentoria(sessionToReject, rejectionReason);
    }
  };

  const abrirPerfil = (perfil: Perfil) => {
    setSelectedProfile(perfil);
    setProfileModalVisible(true);
  };

  const isInCourse = (sessao: SessaoMentoriaExtended): boolean => {
    if (sessao.status !== 'aceita') return false;
    const sessionStart = new Date(`${sessao.data}T${sessao.horario}:00`);
    const sessionEnd = new Date(sessionStart.getTime() + 30 * 60000);
    const now = new Date();
    return now >= sessionStart && now < sessionEnd;
  };

  const isCancellable = (sessao: SessaoMentoriaExtended): boolean => {
    const sessionDateTime = new Date(`${sessao.data}T${sessao.horario}:00`);
    const now = new Date();
    const diffHours = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 24;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <HeaderHomes screenName="Painel do Mentor" onOpenSettings={() => setSettingsVisible(true)} />
      </View>

      <Text style={styles.sectionTitle}>Agenda de Sessões</Text>

      {/* Sessões Em Curso */}
      <Text style={styles.sectionTitle}>Sessões Em Curso</Text>
      {loadingSessions ? (
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      ) : inCourseSessions.length > 0 ? (
        inCourseSessions.map((sessao) => (
          <View key={sessao.sessaoId} style={styles.card}>
            <Text style={styles.dateText}>{`📅 ${sessao.data} - ${sessao.horario}`}</Text>
            <View style={styles.sessionInfo}>
              <TouchableOpacity
                onPress={async () => {
                  const perfil = await fetchPerfil(sessao.usuarioId);
                  abrirPerfil(perfil);
                }}
              >
                <Image
                  source={{ uri: sessao.fotoUsuario || 'https://via.placeholder.com/50' }}
                  style={styles.userImage}
                />
              </TouchableOpacity>
              <View style={styles.detailsContainer}>
                <Text style={styles.userName}>{sessao.nomeUsuario}</Text>
                <Text style={styles.detailText}>Categoria: {sessao.categoria}</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.sessionText}>Nenhuma sessão em curso.</Text>
      )}

      {/* Próximas Sessões */}
      <Text style={styles.sectionTitle}>Próximas Sessões</Text>
      {loadingSessions ? (
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      ) : upcomingSessions.length > 0 ? (
        upcomingSessions.map((sessao) => (
          <View key={sessao.sessaoId} style={styles.card}>
            <Text style={styles.dateText}>{`📅 ${sessao.data} - ${sessao.horario}`}</Text>
            <View style={styles.sessionInfo}>
              <TouchableOpacity
                onPress={async () => {
                  const perfil = await fetchPerfil(sessao.usuarioId);
                  abrirPerfil(perfil);
                }}
              >
                <Image
                  source={{ uri: sessao.fotoUsuario || 'https://via.placeholder.com/50' }}
                  style={styles.userImage}
                />
              </TouchableOpacity>
              <View style={styles.detailsContainer}>
                <Text style={styles.userName}>{sessao.nomeUsuario}</Text>
                <Text style={styles.detailText}>Categoria: {sessao.categoria}</Text>
              </View>
              {sessao.status === 'aceita' && isInCourse(sessao) && (
                <View style={styles.inCourseBadge}>
                  <Text style={styles.inCourseText}>Em Curso</Text>
                </View>
              )}
            </View>
            {sessao.status === 'aceita' && isCancellable(sessao) && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#FF5252' }]}
                onPress={() => openCancelModal(sessao.sessaoId)}
                disabled={loadingCancelar === sessao.sessaoId}
              >
                {loadingCancelar === sessao.sessaoId ? (
                  <ActivityIndicator color={theme.buttonText} />
                ) : (
                  <Text style={styles.buttonText}>Cancelar</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.sessionText}>Nenhuma sessão agendada.</Text>
      )}

      {/* Sessões Pendentes */}
      <Text style={styles.sectionTitle}>Solicitações Pendentes</Text>
      {loadingSessions ? (
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      ) : pendingSessions.length > 0 ? (
        pendingSessions.map((sessao) => (
          <View key={sessao.sessaoId} style={styles.card}>
            <Text style={styles.dateText}>{`📅 ${sessao.data} - ${sessao.horario}`}</Text>
            <View style={styles.sessionInfo}>
              <TouchableOpacity
                onPress={async () => {
                  const perfil = await fetchPerfil(sessao.usuarioId);
                  abrirPerfil(perfil);
                }}
              >
                <Image
                  source={{ uri: sessao.fotoUsuario || 'https://via.placeholder.com/50' }}
                  style={styles.userImage}
                />
              </TouchableOpacity>
              <View style={styles.detailsContainer}>
                <Text style={styles.userName}>{sessao.nomeUsuario}</Text>
                <Text style={styles.detailText}>Categoria: {sessao.categoria}</Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => aceitarMentoria(sessao.sessaoId)}
                disabled={loadingAceitar === sessao.sessaoId}
              >
                {loadingAceitar === sessao.sessaoId ? (
                  <ActivityIndicator color={theme.buttonText} />
                ) : (
                  <Text style={styles.buttonText}>Aceitar</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#FF5252' }]}
                onPress={() => {
                  setSessionToReject(sessao.sessaoId);
                  setRejectModalVisible(true);
                }}
                disabled={loadingRejeitar === sessao.sessaoId}
              >
                {loadingRejeitar === sessao.sessaoId ? (
                  <ActivityIndicator color={theme.buttonText} />
                ) : (
                  <Text style={styles.buttonText}>Rejeitar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.sessionText}>Nenhuma solicitação pendente.</Text>
      )}

      {/* Sessões Finalizadas */}
<Text style={styles.sectionTitle}>Sessões Finalizadas</Text>
{loadingSessions ? (
  <ActivityIndicator size="large" color={theme.buttonBackground} />
) : finalizedSessions.length > 0 ? (
  finalizedSessions.map((sessao) => (
    <View key={sessao.sessaoId} style={styles.card}>
      <Text style={styles.dateText}>{`📅 ${sessao.data} - ${sessao.horario}`}</Text>
      <View style={styles.sessionInfo}>
        <TouchableOpacity
          onPress={async () => {
            const perfil = await fetchPerfil(sessao.usuarioId);
            abrirPerfil(perfil);
          }}
        >
          <Image
            source={{ uri: sessao.fotoUsuario || 'https://via.placeholder.com/50' }}
            style={styles.userImage}
          />
        </TouchableOpacity>
        <View style={styles.detailsContainer}>
          <Text style={styles.userName}>{sessao.nomeUsuario}</Text>
          <Text style={styles.detailText}>Categoria: {sessao.categoria}</Text>
        </View>
      </View>

      {/* Avaliação: só renderiza se existir */}
      {sessao.avaliacao && (
        <View style={styles.avaliacaoContainer}>
          <Text style={styles.detailText}>⭐ Nota: {sessao.avaliacao.nota} / 5</Text>
          {sessao.avaliacao.comentario ? (
            <Text style={styles.detailText}>💬 Comentário: {sessao.avaliacao.comentario}</Text>
          ) : null}
        </View>
      )}
    </View>
  ))
) : (
  <Text style={styles.sessionText}>Nenhuma sessão finalizada.</Text>
)}


      {/* Modal de Perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => {
          setProfileModalVisible(!profileModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Perfil do Usuário</Text>
            {selectedProfile && (
              <>
                <Image
                  source={{ uri: selectedProfile.profileImage || 'https://via.placeholder.com/150' }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalText}>Nome: {selectedProfile.nome}</Text>
                <Text style={styles.modalText}>Bio: {selectedProfile.bio}</Text>
                <Text style={styles.modalText}>Sobre: {selectedProfile.sobre}</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={() => setProfileModalVisible(!profileModalVisible)}
            >
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Rejeição */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rejectModalVisible}
        onRequestClose={() => {
          setRejectModalVisible(!rejectModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Motivo da Rejeição</Text>
            <TextInput
              style={styles.input}
              onChangeText={setRejectionReason}
              value={rejectionReason}
              placeholder="Digite o motivo da rejeição"
              placeholderTextColor={theme.placeholderTextColor}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.button} onPress={confirmRejectMentoria}>
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#FF5252' }]}
                onPress={() => setRejectModalVisible(!rejectModalVisible)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Cancelamento */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => {
          setCancelModalVisible(!cancelModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Motivo do Cancelamento</Text>
            <TextInput
              style={styles.input}
              onChangeText={setCancelReason}
              value={cancelReason}
              placeholder="Digite o motivo do cancelamento"
              placeholderTextColor={theme.placeholderTextColor}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.button} onPress={confirmCancelMentoria}>
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#FF5252' }]}
                onPress={() => setCancelModalVisible(!cancelModalVisible)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SettingsScreenMentor isVisible={isSettingsVisible} onClose={() => setSettingsVisible(false)} />
    </ScrollView>
  );
};

export default MentorDashboard;
