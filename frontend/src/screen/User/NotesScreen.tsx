import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Share 
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "src/config";
import HeaderComum from "../HeaderComum";

interface Nota {
  id: string;
  conteudo: string;
  favorita: boolean;
  tags?: string[];
}

const BlocoDeNotasScreen = ({ navigation }: any) => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [novaNota, setNovaNota] = useState("");
  const [tags, setTags] = useState("");
  const [editandoNota, setEditandoNota] = useState<Nota | null>(null);
  const [loading, setLoading] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

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
      const response = await axios.get(`${API_BASE_URL}/notas?usuarioId=${id}`);
      setNotas(response.data);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
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
    try {
      await axios.put(`${API_BASE_URL}/notas/${nota.id}`, { favorita: !nota.favorita });
      setNotas(notas.map((n) =>
        n.id === nota.id ? { ...n, favorita: !n.favorita } : n
      ));
    } catch (error) {
      console.error("Erro ao favoritar nota:", error);
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

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Bloco de Notas" />
      <Text style={styles.titulo}>Minhas Anotações</Text>

      <TextInput
        style={styles.input}
        placeholder="Título da anotação (ex: React, Banco de Dados)"
        value={tags}
        onChangeText={setTags}
      />

      <TextInput
        style={[styles.input, styles.inputDescricao]}
        placeholder="Descrição da anotação..."
        value={novaNota}
        onChangeText={setNovaNota}
        multiline
      />

      <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionarNota}>
        <Text style={styles.textoBotao}>{editandoNota ? "Salvar" : "Adicionar Nota"}</Text>
      </TouchableOpacity>

      {editandoNota && (
        <TouchableOpacity style={styles.botaoCancelar} onPress={cancelarEdicao}>
          <Text style={styles.textoBotao}>Cancelar</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#2979FF" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={styles.listaNotas} showsVerticalScrollIndicator={true}>
          {notas.map((nota) => (
            <TouchableOpacity
              key={nota.id}
              style={[styles.notaContainer, nota.favorita && styles.notaFavorita]}
              onPress={() => navigation.navigate("DetalheNotaScreen", { nota })}
            >
              <View style={{ flex: 1 }}>
                {Array.isArray(nota.tags) && nota.tags.length > 0 && (
                  <Text style={styles.notaTitulo}>{nota.tags.join(", ")}</Text>
                )}
                <Text style={styles.notaDescricao}>{nota.conteudo}</Text>
              </View>
              <View style={styles.acoesContainer}>
                <TouchableOpacity onPress={() => alternarFavorito(nota)}>
                  <MaterialIcons
                    name={nota.favorita ? "favorite" : "favorite-border"}
                    size={24}
                    color={nota.favorita ? "#FF5252" : "black"}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => iniciarEdicao(nota)}>
                  <MaterialIcons name="edit" size={24} color="#2979FF" />
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  titulo: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, backgroundColor: "#fff", marginBottom: 10 },
  inputDescricao: { minHeight: 80, textAlignVertical: "top" },
  botaoAdicionar: { backgroundColor: "#2979FF", padding: 12, borderRadius: 8, alignItems: "center" },
  botaoCancelar: { backgroundColor: "red", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  textoBotao: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  listaNotas: { marginTop: 10 },
  notaContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#E3F2FD", padding: 10, borderRadius: 8, marginTop: 10 },
  notaFavorita: { backgroundColor: "#FFEBEE" },
  notaTitulo: { fontSize: 18, fontWeight: "bold", color: "#004AAD" },
  notaDescricao: { fontSize: 16, color: "#555", marginTop: 5 },
  acoesContainer: { flexDirection: "row", gap: 10 },
});

export default BlocoDeNotasScreen;
