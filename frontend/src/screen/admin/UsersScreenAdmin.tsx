import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderComum from '../HeaderComum';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from 'src/types/types';
import { ThemeContext } from 'src/context/ThemeContext';
import { Dimensions } from 'react-native';

interface User {
  id: string;
  nome: string;
  email: string;
  profileImage?: string;
  tipo_de_usuario: 'USER' | 'MENTOR' | 'ADMIN';
  bio?: string;
  sobre?: string;
}

interface Solicitation {
  email: string;
  tipoSolicitado: 'MENTOR' | 'ADMIN';
  status: 'pendente' | 'aprovado' | 'rejeitado';
  criadoEm: { _seconds: number; _nanoseconds: number };
}

const SUPER_ADMIN_ID = "mZkU0DJhVMqoIfychMd2";
const windowHeight = Dimensions.get('window').height;
const UsersScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [solicitacoes, setSolicitacoes] = useState<Solicitation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [removalModalVisible, setRemovalModalVisible] = useState(false);
  const [userToRemove, setUserToRemove] = useState<string | null>(null);

  // Estados do usuário logado
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const uid = await AsyncStorage.getItem('usuarioId');
      const email = await AsyncStorage.getItem('userEmail');
      setCurrentUserId(uid);
      setCurrentUserEmail(email);
    };
    fetchCurrentUser();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/usuarios`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSolicitacoes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/solicitacoes-promocao`);
      const data = await response.json();
      setSolicitacoes(data);
    } catch (error) {
      console.error('Erro ao buscar solicitações de promoção:', error);
    }
  };

  const fetchUserProfile = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/perfil/${id}`);
      const data = await res.json();
      setSelectedUser(data);
      setModalVisible(true);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSolicitacoes();
  }, []);

  const removerUsuario = (email: string) => {
    setUserToRemove(email);
    setRemovalModalVisible(true);
  };

  const confirmarRemocaoUsuarios = async () => {
    if (!userToRemove) return;
    try {
      const storedUserEmail = await AsyncStorage.getItem('userEmail');

      if (userToRemove === SUPER_ADMIN_ID) {
        Alert.alert('Aviso', 'Não é permitido remover o Super Admin.');
        return;
      }
      if (storedUserEmail && userToRemove === storedUserEmail) {
        Alert.alert('Aviso', 'Você não pode se remover.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/removerusuario`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userToRemove }),
      });
      const result = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso', result.message);
        fetchUsers();
        if (userToRemove === storedUserEmail) {
          await AsyncStorage.clear();
          navigation.replace('LoginRegister');
        }
      } else {
        Alert.alert('Erro', result.message || 'Erro inesperado ao remover.');
      }
    } catch (error) {
      console.error('[Remoção] Erro ao remover o usuário:', error);
      Alert.alert('Erro', 'Erro ao remover o usuário.');
    } finally {
      setRemovalModalVisible(false);
      setUserToRemove(null);
    }
  };

  const renderUserCard = ({ item }: { item: User }) => {
    const solicitacaoPendente = solicitacoes.find(
      (sol) => sol.email === item.email && sol.status === 'pendente'
    );

    const promoverUsuario = async () => {
      let rota = '';
      if (item.tipo_de_usuario === 'USER') rota = '/auth/promovermentores';
      else if (item.tipo_de_usuario === 'MENTOR') rota = '/auth/promoveradmin';
      if (!rota) return;
      try {
        const response = await fetch(`${API_BASE_URL}${rota}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: item.email }),
        });
        const result = await response.json();
        if (response.ok) {
          Alert.alert('Sucesso', result.message);
          fetchUsers();
          fetchSolicitacoes();
        } else {
          Alert.alert('Erro', result.message);
        }
      } catch (error) {
        console.error('Erro na promoção:', error);
        Alert.alert('Erro', 'Erro ao promover o usuário.');
      }
    };

    const rejeitarSolicitacao = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/rejeitar-solicitacao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: item.email }),
        });
        const result = await response.json();
        if (response.ok) {
          Alert.alert('Sucesso', result.message);
          fetchSolicitacoes();
        } else {
          Alert.alert('Erro', result.message);
        }
      } catch (error) {
        console.error('Erro ao rejeitar a solicitação:', error);
        Alert.alert('Erro', 'Erro ao rejeitar a solicitação.');
      }
    };

    let showRemoveButton = true;
    if (item.tipo_de_usuario === 'ADMIN' && (!currentUserId || currentUserId !== SUPER_ADMIN_ID))
      showRemoveButton = false;
    if (currentUserEmail && item.email === currentUserEmail) showRemoveButton = false;
    if (item.id === SUPER_ADMIN_ID) showRemoveButton = false;

    return (
      <View style={styles.userCard}>
        <TouchableOpacity onPress={() => fetchUserProfile(item.id)}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.profilePhoto} />
          ) : (
            <MaterialIcons name="person" size={50} color="#aaa" />
          )}
        </TouchableOpacity>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.textColor }]}>{item.nome}</Text>
          <Text style={[styles.userEmail, { color: theme.textColor }]}>{item.email}</Text>
          <Text style={[styles.userRole, { color: theme.buttonBackground }]}>
            Tipo: {item.tipo_de_usuario}
          </Text>
          <View style={styles.actions}>
            {solicitacaoPendente && solicitacaoPendente.tipoSolicitado === 'MENTOR' && (
              <>
                <TouchableOpacity style={[styles.button, styles.promotionButton]} onPress={promoverUsuario}>
                  <Text style={styles.buttonText}>Promover a Mentor</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={rejeitarSolicitacao}>
                  <Text style={styles.buttonText}>Rejeitar</Text>
                </TouchableOpacity>
              </>
            )}
            {solicitacaoPendente && solicitacaoPendente.tipoSolicitado === 'ADMIN' && (
              <>
                <TouchableOpacity style={[styles.button, styles.promotionButton]} onPress={promoverUsuario}>
                  <Text style={styles.buttonText}>Promover a Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={rejeitarSolicitacao}>
                  <Text style={styles.buttonText}>Rejeitar</Text>
                </TouchableOpacity>
              </>
            )}
            {showRemoveButton && (
              <TouchableOpacity
                style={[styles.button, styles.removeButton]}
                onPress={() => removerUsuario(item.email)}
              >
                <Text style={styles.buttonText}>Remover</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      </View>
    );
  }

  return (
    // Aqui definimos a altura para 100vh para garantir que o contêiner ocupe toda a tela na web
    <View style={[styles.container, { minHeight: windowHeight }]}>
      <HeaderComum screenName="Gerenciar Usuários" />
      {/* ScrollView com overflow auto para forçar a rolagem */}
      <ScrollView style={{ flex: 1,  overflow: 'scroll' }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.listContainer}>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserCard}
          />
        </View>
      </ScrollView>

      {/* Modal de Confirmação de Remoção */}
      <Modal
        visible={removalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRemovalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Remoção</Text>
            <Text style={styles.modalText}>
              Tem certeza que deseja remover o usuário com o e-mail:
            </Text>
            <Text style={[styles.modalText, { fontWeight: 'bold', color: theme.buttonBackground }]}>
              {userToRemove}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between', width: '100%' }}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => {
                  setRemovalModalVisible(false);
                  setUserToRemove(null);
                }}
              >
                <Text style={{ color: '#000' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: '#FF4B5C' }]}
                onPress={confirmarRemocaoUsuarios}
              >
                <Text style={{ color: '#fff' }}>Remover</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Perfil */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Perfil do Usuário</Text>
            {selectedUser?.profileImage && (
              <Image source={{ uri: selectedUser.profileImage }} style={styles.modalImage} />
            )}
            <Text style={styles.modalText}>Nome: {selectedUser?.nome}</Text>
            <Text style={styles.modalText}>Email: {selectedUser?.email}</Text>
            <Text style={styles.modalText}>Tipo: {selectedUser?.tipo_de_usuario}</Text>
            {selectedUser?.bio && <Text style={styles.modalText}>Bio: {selectedUser.bio}</Text>}
            {selectedUser?.sobre && <Text style={styles.modalText}>Sobre: {selectedUser.sobre}</Text>}
            <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#fff' }}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.dashboardBackground,
    },
    listContainer: {
      paddingBottom: 16,
      paddingHorizontal: 8,
    },
    userCard: {
      padding: 15,
      marginVertical: 10,
      backgroundColor: theme.cardBackground,
      borderRadius: 10,
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
      flexDirection: 'row',
    },
    userDetails: {
      marginLeft: 10,
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.textColor,
    },
    userEmail: {
      fontSize: 14,
      color: theme.textColor,
    },
    userRole: {
      fontSize: 13,
      color: theme.buttonBackground,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 10,
      justifyContent: 'space-around',
      flexWrap: 'wrap',
    },
    button: {
      backgroundColor: theme.buttonBackground,
      padding: 10,
      borderRadius: 5,
      marginHorizontal: 5,
      marginTop: 5,
    },
    promotionButton: {
      backgroundColor: '#4CAF50',
    },
    rejectButton: {
      backgroundColor: '#FF9800',
    },
    removeButton: {
      backgroundColor: '#FF4B5C',
    },
    buttonText: {
      color: theme.buttonText,
      fontWeight: 'bold',
    },
    profilePhoto: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#ddd',
      marginRight: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.dashboardBackground,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      width: '90%',
    },
    modalTitle: {
      fontWeight: 'bold',
      fontSize: 18,
      marginBottom: 12,
      color: theme.textColor,
    },
    modalImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginVertical: 10,
    },
    modalText: {
      fontSize: 14,
      marginVertical: 4,
      textAlign: 'center',
      color: theme.textColor,
    },
    modalButton: {
      marginTop: 20,
      backgroundColor: theme.buttonBackground,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
  });

export default UsersScreen;
