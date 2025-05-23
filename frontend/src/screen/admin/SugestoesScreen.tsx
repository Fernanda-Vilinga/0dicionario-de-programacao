import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  ActivityIndicator,
  Modal,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import API_BASE_URL from 'src/config';
import Header from '../HeaderComum';
import { ThemeContext } from 'src/context/ThemeContext';

interface Sugestao {
  id: string;
  categoria: string;
  descricao: string;
  status: string;
  usuarioId: string;
  usuario?: {
    nome: string;
    email: string;
    profileImage: string;
  };
}

const SugestoesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(theme), [theme]);
  
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [usuarioModal, setUsuarioModal] = useState<any>(null);

  // Função para buscar perfil do usuário a partir do usuarioId
  const buscarPerfilUsuario = async (usuarioId: string) => {
    try {
      const resposta = await axios.get(`${API_BASE_URL}/perfil/${usuarioId}`);
      return resposta.data;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return null;
    }
  };

  // Carrega as sugestões e enriquece cada uma com os dados do usuário
  const carregarSugestoes = async () => {
    try {
      const resposta = await axios.get(`${API_BASE_URL}/sugestoes`);
      const dados: Sugestao[] = resposta.data;
      const dadosEnriquecidos = await Promise.all(
        dados.map(async (sugestao) => {
          const perfil = await buscarPerfilUsuario(sugestao.usuarioId);
          return {
            ...sugestao,
            usuario: perfil,
          };
        })
      );
      setSugestoes(dadosEnriquecidos);
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
      setErro('Erro ao carregar sugestões');
    } finally {
      setCarregando(false);
    }
  };

  // Atualiza o status de uma sugestão
  const atualizarStatus = async (id: string, novoStatus: string) => {
    try {
      await axios.put(`${API_BASE_URL}/sugestoes/${id}`, { status: novoStatus });
      Alert.alert('Sucesso', 'Status atualizado');
      carregarSugestoes();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  // Abre o modal de perfil (ao clicar na foto)
  const abrirModalPerfil = (usuario: any) => {
    if (!usuario) {
      Alert.alert('Erro', 'Dados do perfil não disponíveis');
      return;
    }
    setUsuarioModal(usuario);
    setModalVisivel(true);
  };

  useEffect(() => {
    carregarSugestoes();
  }, []);

  // Função de renderItem do FlatList
  const renderItem = ({ item }: { item: Sugestao }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        {item.usuario?.profileImage ? (
          <TouchableOpacity onPress={() => abrirModalPerfil(item.usuario)}>
            <Image
              source={{ uri: item.usuario.profileImage }}
              style={styles.fotoPerfil}
            />
          </TouchableOpacity>
        ) : (
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.fotoPerfil}
          />
        )}
        <View style={styles.detalhesUsuario}>
          <Text style={styles.nomeUsuario}>{item.usuario?.nome || 'Nome não disponível'}</Text>
          <Text style={styles.emailUsuario}>{item.usuario?.email || 'Email não disponível'}</Text>
        </View>
      </View>
      <Text style={{ color: theme.textColor }}>
  <Text style={[styles.bold]}>Categoria: </Text>
  {item.categoria}
</Text>

<Text style={{ color: theme.textColor }}>
  <Text style={styles.bold}>Descrição: </Text>
  {item.descricao}
</Text>

<Text style={{ color: theme.textColor }}>
  <Text style={styles.bold}>Status: </Text>
  {item.status}
</Text>

      <View style={styles.botoes}>
        {item.status !== 'aceite' && (
          <Button title="Aprovar" onPress={() => atualizarStatus(item.id, 'aceite')} />
        )}
        <Button title="Rejeitar" onPress={() => atualizarStatus(item.id, 'rejeitado')} color="red" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header screenName="Sugestões" />
      <Text style={styles.titulo}>Sugestões Recebidas</Text>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {carregando ? (
  <View style={styles.carregandoContainer}>
    <ActivityIndicator size="large" color={theme.primaryColor} />
    <Text style={{ color: theme.textColor, marginTop: 10 }}>Carregando sugestões...</Text>
  </View>
) : (
  <FlatList
    data={sugestoes}
    keyExtractor={(item) => item.id}
    renderItem={renderItem}
    contentContainerStyle={styles.lista}
  />
)}


      {/* Modal de Perfil */}
      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {usuarioModal && (
              <>
                <Image
                  source={{ uri: usuarioModal.profileImage || 'https://via.placeholder.com/100' }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalNome}>{usuarioModal.nome}</Text>
                <Text style={styles.modalEmail}>{usuarioModal.email}</Text>
              </>
            )}
            <TouchableOpacity style={styles.modalFechar} onPress={() => setModalVisivel(false)}>
              <Text style={styles.modalFecharTexto}>Fechar</Text>
            </TouchableOpacity>
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
      backgroundColor: theme.backgroundColor, // Utiliza o background definido no tema
    },
    titulo: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.buttonBackground, // Exemplo: cor do título baseada no tema
      marginBottom: 20,
      textAlign: 'center',
    },
    erro: {
      backgroundColor: '#ffe5e5',
      color: '#b00020',
      padding: 10,
      borderRadius: 6,
      marginBottom: 10,
      fontSize: 14,
      fontWeight: '500',
    },
    lista: {
      paddingBottom: 100,
    },
    card: {
     
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
    },
    bold: {
      fontWeight: 'bold',
      
    },
    botoes: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    fotoPerfil: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
    },
    detalhesUsuario: {
      justifyContent: 'center',
    },
    nomeUsuario: {
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.primaryColor,
    },
    emailUsuario: {
      fontSize: 14,
      color: theme.textColor,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.backgroundColor,
      width: '80%',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    modalImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10,
    },
    modalNome: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.primaryColor,
      marginBottom: 8,
    },
    modalEmail: {
      fontSize: 16,
      color: theme.textColor,
      marginBottom: 16,
    },
    modalFechar: {
      backgroundColor: theme.buttonBackground,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    modalFecharTexto: {
      color: theme.buttonText,
      fontWeight: 'bold',
    },
    carregandoContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
    },
    
  });

export default SugestoesScreen;
