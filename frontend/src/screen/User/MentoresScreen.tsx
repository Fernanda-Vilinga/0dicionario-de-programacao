import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Image, 
  Modal,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import HeaderComum from '../HeaderComum';
import axios from 'axios';
import API_BASE_URL from 'src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ThemeContext } from 'src/context/ThemeContext';

interface Mentor {
  id: string;
  nome: string;
  bio: string;
  online: boolean;
  imagem?: string; // pode estar ausente
  profileImage?: string; // campo que vem no backend
  horario: string;
  sobre: string;
}

type RootStackParamList = {
  Mentores: {
    area?: string;
    subarea?: string;
  };
};

const MentoresScreen: React.FC = () => {
  const [mentores, setMentores] = useState<Mentor[]>([]);
  const [mentorSelecionado, setMentorSelecionado] = useState<Mentor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState('Basico');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingSolicitacao, setLoadingSolicitacao] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  
  // Estados para seleção de data e hora
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dataMentoria, setDataMentoria] = useState(new Date());
  const [horaMentoria, setHoraMentoria] = useState(new Date());

  // Recupera a categoria a partir dos parâmetros de rota
  const route = useRoute<RouteProp<RootStackParamList, 'Mentores'>>();
  const categoriaSelecionada = route.params?.subarea || route.params?.area || 'Geral';

  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const fetchMentores = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/mentores`);
        setMentores(response.data);
      } catch (err) {
        setError('Erro ao buscar mentores.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsuario = async () => {
      try {
        const id = await AsyncStorage.getItem('usuarioId');
        if (id) {
          setUsuarioId(id);
          console.log('Usuário logado:', id);
        } else {
          console.warn('Nenhum usuário logado encontrado.');
        }
      } catch (err) {
        console.error('Erro ao buscar usuário do AsyncStorage', err);
      }
    };

    fetchMentores();
    fetchUsuario();
  }, []);

  const abrirDetalhesMentor = (mentor: Mentor) => {
    setMentorSelecionado(mentor);
    setModalVisible(true);
  };

  const solicitarMentoria = async () => {
    if (!mentorSelecionado || !usuarioId) {
      alert('Erro: usuário ou mentor não encontrado.');
      return;
    }
  
    const dataFormatada = dataMentoria.toISOString().split('T')[0];
    const horaFormatada = horaMentoria.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
    // Verifica se a data/hora selecionada é futura
    const dataHoraMentoria = new Date(`${dataFormatada}T${horaFormatada}:00Z`);
    if (dataHoraMentoria <= new Date()) {
      alert('Escolha uma data/hora futura para a mentoria.');
      return;
    }
  
    const dadosSolicitacao = {
      usuarioId,
      mentorId: mentorSelecionado.id,
      data: dataFormatada,
      horario: horaFormatada,
      planoMentoria: planoSelecionado,
      categoria: categoriaSelecionada,
    };
  
    console.log('Usuário ID:', usuarioId);
    console.log('Mentor ID:', mentorSelecionado?.id);
    console.log('Dados preparados para envio:', JSON.stringify(dadosSolicitacao, null, 2));
  
    setLoadingSolicitacao(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/mentoria/agendar`, dadosSolicitacao);
      console.log('Resposta do servidor:', response.data);
      alert('Mentoria solicitada com sucesso!');
      setModalVisible(false);
    } catch (error: any) {
      if (error.response) {
        console.error('Erro na resposta do servidor:', error.response.data);
        alert(`Erro: ${error.response.data.message || 'Erro desconhecido'}`);
      } else if (error.request) {
        console.error('Nenhuma resposta recebida do servidor:', error.request);
        alert('Erro de conexão. Verifique sua internet.');
      } else {
        console.error('Erro ao configurar requisição:', error.message);
        alert('Erro ao solicitar mentoria. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoadingSolicitacao(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.buttonBackground} />
        <Text style={{ color: theme.textColor }}>Carregando mentores...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <HeaderComum screenName="Mentoria" />
      <Text style={[styles.titulo, { color: theme.textColor }]}>Escolha um mentor</Text>
      <FlatList
        data={mentores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Obter a imagem do mentor: priorizamos item.imagem; se não existir, usa item.profileImage
          const mentorImage = item.imagem || item.profileImage;
          return (
            <TouchableOpacity style={[styles.card , { backgroundColor: theme.backgroundColor }]}onPress={() => abrirDetalhesMentor(item)}>
              <Image
                source={{ 
                  uri: mentorImage 
                    ? (mentorImage.startsWith('data:') 
                        ? mentorImage 
                        : `data:image/jpeg;base64,${mentorImage}`) 
                    : 'https://via.placeholder.com/150'
                }}
                style={styles.imagem}
              />
              <View style={styles.infoContainer}>
                <Text style={[styles.nome, { color: theme.textColor }]}>{item.nome}</Text>
                <Text style={[styles.bio, { color: theme.textColor }]}>{item.bio}</Text>
                <Text style={[styles.status, { color: item.online ? 'green' : 'red' }]}>
                  {item.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      
      {/* Modal de Detalhes */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundColor }]}>
          {/* Botão de fechar */}
          <TouchableOpacity
            style={styles.botaoFechar}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {mentorSelecionado && (
            <>
              <Image
                source={{ 
                  uri: (mentorSelecionado.imagem || mentorSelecionado.profileImage)
                    ? ((mentorSelecionado.imagem || mentorSelecionado.profileImage)!.startsWith('data:')
                        ? (mentorSelecionado.imagem || mentorSelecionado.profileImage)
                        : `data:image/jpeg;base64,${mentorSelecionado.imagem || mentorSelecionado.profileImage}`)
                    : 'https://via.placeholder.com/150'
                }}
                style={styles.imagemGrande}
              />
              <Text style={[styles.modalNome, { color: theme.textColor }]}>{mentorSelecionado.nome}</Text>
              <Text style={[styles.modalBio, { color: theme.textColor }]}>{mentorSelecionado.bio}</Text>
              <Text style={[styles.label, { color: theme.textColor }]}>Status:</Text>
              <Text style={[styles.modalTexto, { color: mentorSelecionado.online ? 'green' : 'red' }]}>
                {mentorSelecionado.online ? 'Online' : 'Offline'}
              </Text>
              <Text style={[styles.label, { color: theme.textColor }]}>Sobre:</Text>
              <Text style={[styles.modalTexto, { color: theme.textColor }]}>{mentorSelecionado.sobre}</Text>
              
              <TouchableOpacity style={styles.botaoData} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.botaoDataTexto}>Selecionar Data</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dataMentoria}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDataMentoria(selectedDate);
                  }}
                />
              )}
              <TouchableOpacity style={styles.botaoData} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.botaoDataTexto}>Selecionar Hora</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={horaMentoria}
                  mode="time"
                  display="default"
                  is24Hour={true}
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) setHoraMentoria(selectedTime);
                  }}
                />
              )}
              <Text style={[styles.modalTexto, { color: theme.textColor }]}>
                Data e Hora Selecionadas: {dataMentoria.toLocaleDateString()} às {horaMentoria.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <TouchableOpacity 
                style={[styles.botao, { backgroundColor: theme.buttonBackground }]} 
                onPress={solicitarMentoria}
                disabled={loadingSolicitacao}
              >
                {loadingSolicitacao ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.textoBotao, { color: theme.buttonText }]}>Solicitar Mentoria</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  card: { padding: 15, marginVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  imagem: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  infoContainer: { flex: 1 },
  nome: { fontSize: 18, fontWeight: 'bold' },
  bio: { color: '#555' },
  status: { fontWeight: 'bold', marginTop: 5 },
  modalContainer: { flex: 1, alignItems: 'center', padding: 20 },
  imagemGrande: { width: 150, height: 150, borderRadius: 75, marginBottom: 15 },
  modalNome: { fontSize: 22, fontWeight: 'bold' },
  modalBio: { fontSize: 16, color: '#555', marginBottom: 10 },
  modalTexto: { fontSize: 16, marginBottom: 10 },
  bold: { fontWeight: 'bold' },
  picker: { width: '100%' },
  botao: { backgroundColor: '#2979FF', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center', width: '100%' },
  textoBotao: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  botaoFechar: { position: 'absolute', top: 20, right: 20, backgroundColor: 'red', padding: 5, borderRadius: 50 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  botaoData: {
    backgroundColor: "#2979FF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  botaoDataTexto: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MentoresScreen;
