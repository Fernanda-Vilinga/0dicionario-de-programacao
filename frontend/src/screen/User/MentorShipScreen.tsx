import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HeaderComum from '../HeaderComum';
import ChatsScreen from '../mentor/ChatsScreen';
const { width } = Dimensions.get('window');

type RootStackParamList = {
  Mentoria: undefined;
  Mentores: { area: string; subarea?: string };
  Chat: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Mentoria'>;

type Category = {
  id: string;
  nome: string;
  icon: keyof typeof Ionicons.glyphMap;
  subareas?: string[];
};

const areasMentoria: Category[] = [
  { id: '1', nome: 'Algoritmos e Lógica', icon: 'code-outline' },
  { id: '2', nome: 'Desenvolvimento Web', subareas: ['Frontend', 'Backend', 'Fullstack'], icon: 'globe-outline' },
  { id: '3', nome: 'Desenvolvimento Mobile', subareas: ['Android', 'iOS', 'React Native'], icon: 'phone-portrait-outline' },
  { id: '4', nome: 'UI/UX Design', icon: 'color-palette-outline' },
  { id: '5', nome: 'Inteligência Artificial', icon: 'bulb-outline'  },
  { id: '6', nome: 'Machine Learning', icon: 'analytics-outline' },
  { id: '7', nome: 'Banco de Dados', subareas: ['SQL', 'NoSQL', 'Firebase'], icon: 'server-outline' },
  { id: '8', nome: 'DevOps & Infraestrutura', icon: 'cloud-outline' },
];

const MentoriaScreen: React.FC = () => {
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null);
  const [subareaSelecionada, setSubareaSelecionada] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  const selecionarArea = (area: string) => {
    setAreaSelecionada(area);
    setSubareaSelecionada(null);
  };

  const selecionarSubarea = (subarea: string) => {
    setSubareaSelecionada(subarea);
    navigation.navigate('Mentores', { area: areaSelecionada!, subarea });
  };

  const irParaMentores = () => {
    if (areaSelecionada) {
      navigation.navigate('Mentores', { area: areaSelecionada, subarea: subareaSelecionada || undefined });
    }
  };

  // Botão para acessar o chat é adicionado sem interferir nas demais funcionalidades
  const irParaChat = () => {
    navigation.navigate('Chat');
  };

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Mentoria" />
          {/* Novo botão para acessar o Chat */}
          <TouchableOpacity style={styles.chatButton} onPress={irParaChat}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            <Text style={styles.chatButtonText}>Ir para Chat</Text>
          </TouchableOpacity>
      <Text style={styles.titulo}>Escolha uma área para a mentoria</Text>
      
      <FlatList
        data={areasMentoria}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.botao, areaSelecionada === item.nome && styles.botaoSelecionado]}
            onPress={() => selecionarArea(item.nome)}
          >
            <Ionicons name={item.icon} size={24} color="#fff" />
            <Text style={styles.textoBotao}>{item.nome}</Text>
          </TouchableOpacity>
        )}
      />

      {areaSelecionada && areasMentoria.find(a => a.nome === areaSelecionada)?.subareas && (
        <View style={styles.subareaContainer}>
          <Text style={styles.subtitulo}>Escolha uma subárea:</Text>
          {areasMentoria.find(a => a.nome === areaSelecionada)?.subareas?.map((sub) => (
            <TouchableOpacity 
              key={sub} 
              style={[styles.botaoSubarea, subareaSelecionada === sub && styles.botaoSelecionado]}
              onPress={() => selecionarSubarea(sub)}
            >
              <Text style={styles.textoBotao}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {areaSelecionada && (
        <>
          <TouchableOpacity style={styles.botaoAvancar} onPress={irParaMentores}>
            <Text style={styles.textoBotaoAvancar}>Avançar</Text>
          </TouchableOpacity>
      
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  titulo: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  lista: { alignItems: 'center', justifyContent: 'center' },
  botao: { backgroundColor: '#2979FF', padding: 15, borderRadius: 10, margin: 10, alignItems: 'center', justifyContent: 'center', width: width * 0.4 },
  botaoSelecionado: { backgroundColor: '#004AAD' },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 5 },
  subareaContainer: { marginTop: 20, alignItems: 'center' },
  subtitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  botaoSubarea: { backgroundColor: '#1976D2', padding: 12, borderRadius: 8, marginVertical: 5, width: width * 0.5, alignItems: 'center' },
  botaoAvancar: { marginTop: 20, backgroundColor: '#004AAD', padding: 15, borderRadius: 8, alignItems: 'center' },
  textoBotaoAvancar: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  chatButton: {
    backgroundColor: '#004AAD',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MentoriaScreen;
