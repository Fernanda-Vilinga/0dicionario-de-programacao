import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import HeaderComum from '../HeaderComum';
import API_BASE_URL from 'src/config';
import { Picker } from '@react-native-picker/picker';
import { ThemeContext } from 'src/context/ThemeContext'; // Importa o contexto de tema
import AsyncStorage from '@react-native-async-storage/async-storage';
const DicionarioHome = () => {
  interface TermoItem {
    id: string;
    termo: string;
    definicao: string;
    linguagem?: string;
    exemplos?: string[];
  }
  
  const { theme } = useContext(ThemeContext); // Obtém o tema atual
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoritos, setFavoritos] = useState<{ [key: string]: boolean }>({});
  const [exibirExemplo, setExibirExemplo] = useState<{ [key: string]: boolean }>({});
  const [categoria, setCategoria] = useState('');
  const [linguagem, setLinguagem] = useState('');
  const [ordemAlfabetica, setOrdemAlfabetica] = useState('asc');

  useEffect(() => {
    carregarTodosOsTermos();
  }, []);

  const ordenarTermos = (dados: any[]) => {
    return dados.sort((a, b) => a.termo.localeCompare(b.termo));
  };

  const carregarTodosOsTermos = async () => {
    setLoading(true);
    try {
      const termosResponse = await fetch(`${API_BASE_URL}/dicionario/todos`);
      if (!termosResponse.ok) throw new Error('Erro ao buscar termos.');
      const termosData = await termosResponse.json();
  
      const usuarioId = await AsyncStorage.getItem('usuarioId'); // 🔑 Buscando o ID do usuário
      if (!usuarioId) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        return;
      }
      const favoritosResponse = await fetch(`${API_BASE_URL}/favoritos/${usuarioId}`);
      if (!favoritosResponse.ok) throw new Error('Erro ao buscar favoritos.');
      const favoritosData = await favoritosResponse.json(); // { termos: [], anotacoes: [] }
  
      // Atualiza estado de favoritos com base nos IDs recebidos
      const favoritosMap: { [key: string]: boolean } = {};
      favoritosData.termos.forEach((id: string) => {
        favoritosMap[id] = true;
      });
  
      const dadosOrdenados = ordenarTermos(termosData);
      setResultados(dadosOrdenados);
      setFavoritos(favoritosMap);
  
    } catch (error) {
      console.error('Erro ao carregar termos e favoritos:', error);
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };
  

  const pesquisarTermo = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/dicionario/termos/simples?`;
      const params = new URLSearchParams();
      if (termo.trim()) params.append("termo", termo.trim());
      url += params.toString();
      console.log("🔍 URL da pesquisa:", url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || "Erro ao buscar termo.");
      }
      const data = await response.json();
      const dadosOrdenados = ordenarTermos(data);
      setResultados(dadosOrdenados);
    } catch (error) {
      console.error("Erro ao buscar termo:", error);
      Alert.alert("Erro", error instanceof Error ? error.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  const alternarFavoritoTermo = async (termoItem: TermoItem) => {
    const usuarioId = await AsyncStorage.getItem('usuarioId');
    if (!usuarioId) return;
  
    try {
      if (favoritos[termoItem.id]) {
        await fetch(`${API_BASE_URL}/favoritos`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuarioId,
            tipo: 'termo',
            id: termoItem.id,
          }),
        });
      } else {
        await fetch(`${API_BASE_URL}/favoritos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuarioId,
            tipo: 'termo',
            id: termoItem.id,
          }),
        });
      }
  
      setFavoritos((prev) => ({
        ...prev,
        [termoItem.id]: !prev[termoItem.id],
      }));
    } catch (error) {
      console.error("Erro ao alternar favorito:", error);
    }
  };
  
  

  const falarTermo = (texto: string) => {
    if (Platform.OS === 'web') {
      console.log("Fala não suportada na Web");
    } else {
      Speech.speak(texto);
    }
  };

  const alternarExemplo = (id: string) => {
    setExibirExemplo((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filtra os resultados com base no termo pesquisado
  const resultadosFiltrados = resultados.filter((item) => {
    const termoPesquisado = termo.toLowerCase();
    const nomeTermo = item.termo.toLowerCase();
    const definicao = item.definicao.toLowerCase();
    return nomeTermo.includes(termoPesquisado) || definicao.includes(termoPesquisado);
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <HeaderComum screenName="Dicionário" />
      <Text style={[styles.title, { color: theme.textColor }]}>Enriqueça o teu vocabulário</Text>

      <View style={styles.searchContainer}>
        <TextInput 
          placeholder="Pesquisar..."
          placeholderTextColor={theme.placeholderTextColor}
          style={[
            styles.textInput, 
            { 
              color: theme.textColor, 
              borderColor: theme.borderColor, 
              backgroundColor: theme.cardBackground 
            }
          ]}
          value={termo}
          onChangeText={setTermo}
          onSubmitEditing={pesquisarTermo}
        />
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: "#2979FF" }]} 
          onPress={pesquisarTermo}
        >
          <MaterialIcons name="search" size={24} color={theme.buttonText} />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color={theme.buttonBackground} style={styles.loading} />}

      <FlatList
        data={resultadosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.resultCard, 
            { 
              backgroundColor: theme.cardBackground, 
              borderColor: theme.borderColor, 
              shadowColor: theme.cardShadow 
            }
          ]}>
            <View style={styles.headerRow}>
              <View style={styles.termContainer}>
                <Text style={[styles.term, { color: theme.textColor }]}>{item.termo}</Text>
                <TouchableOpacity onPress={() => falarTermo(item.termo)}>
                  <MaterialIcons 
                    name="volume-up" 
                    size={22} 
                    color={theme.textColor} 
                    style={styles.icon} 
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => alternarFavoritoTermo(item)}>
  <MaterialIcons 
    name={favoritos[item.id] ? "favorite" : "favorite-border"} 
    size={24} 
    color={favoritos[item.id] ? "red" : theme.textColor} 
  />
</TouchableOpacity>

            </View>
            <Text style={[styles.definition, { color: theme.textColor }]}>{item.definicao}</Text>
            <Text style={[styles.language, { color: theme.textColor }]}>
              Linguagem: {item.linguagem || 'Geral'}
            </Text>
            <TouchableOpacity onPress={() => alternarExemplo(item.id)}>
              <Text style={[styles.verExemplo, { color: theme.textColor }]}>Ver Exemplo</Text>
            </TouchableOpacity>
            {exibirExemplo[item.id] && (
              <View style={styles.codeContainer}>
                <Text style={[styles.example, { color: theme.textColor }]}>Exemplo:</Text>
                <Text style={[styles.codeBlock, { color: theme.textColor }]}>
                  {item.exemplos?.[0] || 'Nenhum exemplo disponível'}
                </Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  term: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  definition: {
    marginTop: 5,
  },
  language: {
    fontSize: 14,
    marginTop: 5,
  },
  verExemplo: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  example: {
    fontWeight: 'bold',
  },
  codeBlock: {
    fontFamily: 'monospace',
    padding: 5,
  },
  codeContainer: {
    marginTop: 5,
    padding: 5,
    borderRadius: 5,
  },
  icon: {
    marginLeft: 5,
  },
  loading: {
    marginTop: 10,
  },
});

export default DicionarioHome;
