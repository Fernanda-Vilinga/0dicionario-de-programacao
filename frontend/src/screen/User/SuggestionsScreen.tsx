import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API_BASE_URL from "src/config";
import Header from "../HeaderComum";
import { ThemeContext } from "src/context/ThemeContext";

const categorias = [
  "Dicionário",
  "Quiz",
  "Bloco de Notas",
  "Mentoria",
  "Técnico",
];

const SugestaoScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [usuarioId, setUsuarioId] = useState("");
  const [sugestoes, setSugestoes] = useState<any[]>([]);

  useEffect(() => {
    const obterUsuarioId = async () => {
      const id = await AsyncStorage.getItem("usuarioId");
      if (id) {
        setUsuarioId(id);
        buscarSugestoes(id);
      } else {
        Alert.alert("Erro", "Usuário não autenticado.");
      }
    };

    obterUsuarioId();
  }, []);

  const handleEnviar = async () => {
    if (!categoria || !descricao) {
      return Alert.alert("Atenção", "Preencha todos os campos!");
    }

    try {
      setLoading(true);
      const payload = {
        usuarioId,
        categoria,
        descricao,
        status: "pendente",
      };

      await axios.post(`${API_BASE_URL}/sugestoes`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      setCategoria("");
      setDescricao("");
      Alert.alert("Sucesso", "Sugestão enviada com sucesso!");
      buscarSugestoes(usuarioId); // Atualiza lista
    } catch (error) {
      console.error("Erro ao enviar sugestão:", error);
      Alert.alert("Erro", "Não foi possível enviar a sugestão.");
    } finally {
      setLoading(false);
    }
  };

  const buscarSugestoes = async (id: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sugestoes`);
      const todas = response.data;
      const minhas = todas.filter((s: any) => s.usuarioId === id);
      setSugestoes(minhas);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    }
  };

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.backgroundColor,
      },
      titulo: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        color: theme.buttonBackground,
        textAlign: "center",
      },
      label: {
        fontSize: 16,
        color: theme.textColor,
        marginTop: 12,
        marginBottom: 4,
      },
      pickerContainer: {
        borderWidth: 1,
        borderColor: theme.borderColor,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 10,
        backgroundColor: theme.backgroundColor,
      },
      picker: {
        height: 50,
        width: "100%",
        color: theme.textColor,
        backgroundColor: theme.backgroundColor, // Fundo do picker adaptado ao tema
      },
      input: {
        borderColor: theme.borderColor,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        backgroundColor: theme.cardBackground,
        minHeight: 100,
        color: theme.textColor,
      },
      botao: {
        backgroundColor: theme.buttonBackground,
        paddingVertical: 14,
        borderRadius: 20,
        marginTop: 20,
        alignItems: "center",
      },
      botaoTexto: {
        color: theme.buttonText,
        fontSize: 16,
        fontWeight: "bold",
      },
      listaContainer: {
        flex: 1,
        marginTop: 10,
      },
      sugestaoCard: {
        backgroundColor: theme.cardBackground,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
      },
      sugestaoCategoria: {
        fontWeight: "bold",
        fontSize: 16,
        color: theme.primaryColor || '#2979FF',
      },
      sugestaoDescricao: {
        marginTop: 6,
        fontSize: 14,
        color: theme.textColor,
      },
      sugestaoStatus: {
        marginTop: 6,
        fontSize: 13,
        color: theme.textColorSecondary || '#666',
      },
    });
  }, [theme]);

  return (
    <View style={styles.container}>
      <Header screenName="Sugestões" />
      <FlatList
        ListHeaderComponent={
          <View style={{ paddingBottom: 20, paddingHorizontal: 16 }}>
            <Text style={styles.titulo}>Enviar Sugestão</Text>

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={categoria}
                onValueChange={setCategoria}
                style={styles.picker}
                dropdownIconColor={theme.textColor}
              >
                <Picker.Item label="Selecione uma categoria" value="" />
                {categorias.map((cat, index) => (
                  <Picker.Item key={index} label={cat} value={cat} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Descreva sua sugestão..."
              placeholderTextColor={theme.placeholderTextColor}
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.botao} onPress={handleEnviar} disabled={loading}>
              <Text style={styles.botaoTexto}>
                {loading ? "Enviando..." : "Enviar Sugestão"}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.titulo, { marginTop: 30 }]}>Minhas Sugestões</Text>
          </View>
        }
        data={sugestoes}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => (
          <View style={[styles.sugestaoCard, { marginHorizontal: 16 }]}>
            <Text style={styles.sugestaoCategoria}>{item.categoria}</Text>
            <Text style={styles.sugestaoDescricao}>{item.descricao}</Text>
            <Text style={styles.sugestaoStatus}>Status: {item.status}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default SugestaoScreen;
