import React, { useContext, useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Share 
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "src/config";
import HeaderComum from "../HeaderComum";
import { ThemeContext } from 'src/context/ThemeContext';// Ajuste o caminho conforme sua estrutura

interface Nota {
  id: string;
  conteudo: string;
  favorita: boolean;
  tags?: string[];
}

const BlocoDeNotasScreen = ({ navigation }: any) => {
  const { theme } = useContext(ThemeContext);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [novaNota, setNovaNota] = useState("");
  const [tags, setTags] = useState("");
  const [editandoNota, setEditandoNota] = useState<Nota | null>(null);
  const [loading, setLoading] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const obterUsuarioId = async () => {
      try {
        const idSalvo = await AsyncStorage.getItem("usuarioId");
        if (idSalvo) {
          setUsuarioId(idSalvo);
          carregarNotas(idSalvo);
        }
      } catch (error) {
        console.error("Erro ao obter usuário ID:", error);
      }
    };
    obterUsuarioId();
  }, []);

  const carregarNotas = async (id: string) => {
    setLoading(true);
    try {
      // Busca notas e favoritos simultaneamente
      const [notasRes, favoritosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/notas?usuarioId=${id}`),
        axios.get(`${API_BASE_URL}/favoritos/${id}`),
      ]);
  
      const notasData = notasRes.data;
      const favoritosIds = favoritosRes.data.anotacoes; // array de IDs das notas favoritas
  
      const notasComFavorito = notasData.map((nota: Nota) => ({
        ...nota,
        favorita: favoritosIds.includes(nota.id),
      }));
  
      setNotas(notasComFavorito);
    } catch (error) {
      console.error("Erro ao carregar notas e favoritos:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const adicionarNota = async () => {
    if (!usuarioId || novaNota.trim() === "") return;

    const tagsArray = tags.split(",").map((tag) => tag.trim()).filter((tag) => tag !== "");

    try {
      if (editandoNota) {
        await axios.put(`${API_BASE_URL}/notas/${editandoNota.id}`, {
          conteudo: novaNota,
          tags: tagsArray,
        });
        setNotas(notas.map((nota) =>
          nota.id === editandoNota.id ? { ...nota, conteudo: novaNota, tags: tagsArray } : nota
        ));
        setEditandoNota(null);
      } else {
        const response = await axios.post(`${API_BASE_URL}/notas`, {
          usuarioId,
          conteudo: novaNota,
          tags: tagsArray,
          favorita: false,
        });
        setNotas((prevNotas) => [...prevNotas, response.data]);
      }
      setNovaNota("");
      setTags("");
    } catch (error) {
      console.error("Erro ao adicionar/editar nota:", error);
    }
  };

  const iniciarEdicao = (nota: Nota) => {
    setEditandoNota(nota);
    setNovaNota(nota.conteudo);
    setTags(nota.tags ? nota.tags.join(", ") : "");
  };

  const cancelarEdicao = () => {
    setEditandoNota(null);
    setNovaNota("");
    setTags("");
  };

  const alternarFavorito = async (nota: Nota) => {
    if (!usuarioId) return;
  
    try {
      if (nota.favorita) {
        // Se já é favorita, remove
        await axios.delete(`${API_BASE_URL}/favoritos`, {
          data: {
            usuarioId,
            tipo: "anotacao",
            id: nota.id,
          },
        });
      } else {
        // Se não é favorita, adiciona
        await axios.post(`${API_BASE_URL}/favoritos`, {
          usuarioId,
          tipo: "anotacao",
          id: nota.id,
        });
      }
  
      // Atualiza o estado local
      setNotas(notas.map((n) =>
        n.id === nota.id ? { ...n, favorita: !n.favorita } : n
      ));
    } catch (error) {
      console.error("Erro ao alternar favorito:", error);
    }
  };
  

  const removerNota = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/notas/${id}`);
      setNotas(notas.filter((nota) => nota.id !== id));
    } catch (error) {
      console.error("Erro ao remover nota:", error);
    }
  };

  const compartilharNota = async (nota: Nota) => {
    try {
      const mensagem = `📌 *${nota.tags?.join(", ") || "Nota"}*:\n${nota.conteudo}`;
      await Share.share({
        message: mensagem,
      });
    } catch (error) {
      console.error("Erro ao compartilhar nota:", error);
    }
  };

  // Filtra as notas com base no termo de pesquisa (pesquisando em conteúdo e tags)
  const notasFiltradas = notas.filter((nota) => {
    const termo = searchTerm.toLowerCase();
    const conteudo = nota.conteudo.toLowerCase();
    const tagsString = nota.tags ? nota.tags.join(" ").toLowerCase() : "";
    return conteudo.includes(termo) || tagsString.includes(termo);
  });

  // Cria os estilos de forma dinâmica usando os valores do tema
  const dynamicStyles = StyleSheet.create({
    container: { 
      flex: 1, 
      padding: 20, 
      backgroundColor: theme.backgroundColor 
    },
    titulo: { 
      fontSize: 24, 
      fontWeight: "bold", 
      textAlign: "center", 
      marginBottom: 20,
      color: theme.textColor 
    },
    input: { 
      borderWidth: 1, 
      borderColor: theme.borderColor,
      borderRadius: 8, 
      padding: 10, 
      backgroundColor: theme.cardBackground, 
      marginBottom: 10,
      color: theme.textColor
    },
    inputDescricao: { 
      minHeight: 80, 
      textAlignVertical: "top", 
      color: theme.textColor
    },
    botaoAdicionar: { 
      backgroundColor: theme.buttonBackground, 
      padding: 12, 
      borderRadius: 8, 
      alignItems: "center" 
    },
    botaoCancelar: { 
      backgroundColor: "red", 
      padding: 12, 
      borderRadius: 8, 
      alignItems: "center", 
      marginBottom: 10 
    },
    textoBotao: { 
      color: theme.buttonText, 
      fontWeight: "bold", 
      fontSize: 18 
    },
    listaNotas: { 
      marginTop: 10 
    },
    notaContainer: { 
      flexDirection: "row", 
      alignItems: "center", 
      backgroundColor: theme.cardBackground, 
      padding: 10, 
      borderRadius: 8, 
      marginTop: 10 
    },
    notaFavorita: { 
      backgroundColor: "#FFEBEE" 
    },
    notaTitulo: { 
      fontSize: 18, 
      fontWeight: "bold", 
      color: theme.textColor 
    },
    notaDescricao: { 
      fontSize: 16, 
      color: theme.textColor, 
      marginTop: 5 
    },
    acoesContainer: { 
      flexDirection: "row", 
      gap: 10 
    },
    searchInput: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 8,
      padding: 10,
      backgroundColor: theme.cardBackground,
      marginBottom: 10,
      color: theme.textColor,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <HeaderComum screenName="Bloco de Notas" />
      <Text style={dynamicStyles.titulo}>Minhas Anotações</Text>

      {/* Campo de pesquisa */}
      <TextInput
        style={dynamicStyles.searchInput}
        placeholder="Pesquisar anotações..."
        placeholderTextColor={theme.placeholderTextColor}
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <TextInput
        style={dynamicStyles.input}
        placeholder="Título da anotação (ex: React, Banco de Dados)"
        placeholderTextColor={theme.placeholderTextColor}
        value={tags}
        onChangeText={setTags}
      />

      <TextInput
        style={[dynamicStyles.input, dynamicStyles.inputDescricao]}
        placeholder="Descrição da anotação..."
        placeholderTextColor={theme.placeholderTextColor}
        value={novaNota}
        onChangeText={setNovaNota}
        multiline
      />

      <TouchableOpacity style={dynamicStyles.botaoAdicionar} onPress={adicionarNota}>
        <Text style={dynamicStyles.textoBotao}>
          {editandoNota ? "Salvar" : "Adicionar Nota"}
        </Text>
      </TouchableOpacity>

      {editandoNota && (
        <TouchableOpacity style={dynamicStyles.botaoCancelar} onPress={cancelarEdicao}>
          <Text style={dynamicStyles.textoBotao}>Cancelar</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={theme.buttonBackground} style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={dynamicStyles.listaNotas} showsVerticalScrollIndicator={true}>
          {notasFiltradas.map((nota) => (
            <TouchableOpacity
              key={nota.id}
              style={[dynamicStyles.notaContainer, nota.favorita && dynamicStyles.notaFavorita]}
              onPress={() => navigation.navigate("DetalheNotaScreen", { nota })}
            >
              <View style={{ flex: 1 }}>
                {Array.isArray(nota.tags) && nota.tags.length > 0 && (
                 <Text style={[
                  dynamicStyles.notaTitulo, 
                  nota.favorita && { color: '#000' } // sobrescreve a cor se for favorita
                ]}>
                  {nota.tags.join(", ")}
                </Text>
                )}
              <Text style={[
  dynamicStyles.notaDescricao, 
  nota.favorita && { color: '#000' }
]}>
  {nota.conteudo}
</Text>

                
              </View>
              <View style={dynamicStyles.acoesContainer}>
                <TouchableOpacity onPress={() => alternarFavorito(nota)}>
                  <MaterialIcons
                    name={nota.favorita ? "favorite" : "favorite-border"}
                    size={24}
                    color={nota.favorita ? "#FF5252" : "black"}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => iniciarEdicao(nota)}>
                  <MaterialIcons name="edit" size={24} color={theme.buttonBackground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removerNota(nota.id)}>
                  <MaterialIcons name="delete" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => compartilharNota(nota)}>
                  <MaterialIcons name="share" size={24} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default BlocoDeNotasScreen;
