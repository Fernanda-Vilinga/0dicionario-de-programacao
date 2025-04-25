import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "src/config";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
}

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificacoes = async () => {
    setLoading(true);
    const usuarioId = await AsyncStorage.getItem("usuarioId");
    if (!usuarioId) return;

    const res = await fetch(`${API_BASE_URL}/notificacoes/${usuarioId}`);
    const data = await res.json();
    setNotificacoes(data);
    setLoading(false);
  };

  const marcarComoLida = async (id: string) => {
    await fetch(`${API_BASE_URL}/notificacoes/${id}/marcar-lida`, {
      method: "PATCH",
    });
    fetchNotificacoes(); // Atualiza lista
  };

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#2979FF" />;

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={notificacoes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.card, !item.lida && styles.naoLida]}
          onPress={() => marcarComoLida(item.id)}
        >
          <Text style={styles.titulo}>{item.titulo}</Text>
          <Text style={styles.mensagem}>{item.mensagem}</Text>
          <Text style={styles.data}>{new Date(item.data).toLocaleString()}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  naoLida: {
    backgroundColor: "#e0f2ff", // leve azul para não lidas
  },
  titulo: {
    fontWeight: "bold",
    fontSize: 16,
  },
  mensagem: {
    marginTop: 5,
    fontSize: 14,
  },
  data: {
    marginTop: 10,
    fontSize: 12,
    color: "#777",
    textAlign: "right",
  },
});
