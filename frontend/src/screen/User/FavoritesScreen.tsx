import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "src/config";
import HeaderComum from "../HeaderComum";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemeContext } from "src/context/ThemeContext";

// --- COMPONENTE TermCard ---
interface Termo {
  id: string;
  definicao: string;
  exemplos: string[];
  linguagem: string;
  termo: string;
}

interface TermCardProps {
  term: Termo;
  onDesfavoritar: (id: string) => void;
}

const TermCard: React.FC<TermCardProps> = ({ term, onDesfavoritar }) => {
  const { theme } = useContext(ThemeContext);
  const [fadeAnim] = useState(new Animated.Value(1));

  const desfavoritarTermo = async () => {
    try {
      const usuarioId = await AsyncStorage.getItem("usuarioId");
      await fetch(`${API_BASE_URL}/favoritos`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId,
          tipo: "termo",
          id: term.id,
        }),
      });

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onDesfavoritar(term.id);
      });
    } catch (error) {
      console.error("Erro ao desfavoritar termo:", error);
      Alert.alert("Erro", "Não foi possível remover o termo.");
    }
  };

  return (
    <Animated.View style={[cardStyles.card, { opacity: fadeAnim, backgroundColor: theme.cardBackground }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[cardStyles.cardTitle, { color: theme.cardTextColor }]}>{term.termo}</Text>
        <TouchableOpacity onPress={desfavoritarTermo}>
          <MaterialIcons name="favorite" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>
      <Text style={[cardStyles.cardSubtitle, { color: theme.textColor }]}>Linguagem: {term.linguagem}</Text>
      <Text style={[cardStyles.cardDefinition, { color: theme.textColor }]}>Definição: {term.definicao}</Text>
      {term.exemplos?.length > 0 && (
        <View style={[cardStyles.exampleContainer, { borderLeftColor: theme.borderColor }]}>
          <Text style={[cardStyles.exampleTitle, { color: theme.textColor }]}>Exemplos:</Text>
          {term.exemplos.map((ex, idx) => (
            <Text key={idx} style={[cardStyles.cardExample, { color: theme.textColor }]}>{ex}</Text>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// --- COMPONENTE AnnotationCard ---
interface Anotacao {
  id: string;
  conteudo: string;
  tags: string[];
}

interface AnnotationCardProps {
  anotacao: Anotacao;
  onDesfavoritar: (id: string) => void;
}

const AnnotationCard: React.FC<AnnotationCardProps> = ({ anotacao, onDesfavoritar }) => {
  const { theme } = useContext(ThemeContext);
  const [fadeAnim] = useState(new Animated.Value(1));

  const desfavoritarAnotacao = async () => {
    try {
      const usuarioId = await AsyncStorage.getItem("usuarioId");
      await fetch(`${API_BASE_URL}/favoritos`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId,
          tipo: "anotacao",
          id: anotacao.id,
        }),
      });

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onDesfavoritar(anotacao.id);
      });
    } catch (error) {
      console.error("Erro ao desfavoritar anotação:", error);
      Alert.alert("Erro", "Não foi possível remover a anotação.");
    }
  };

  return (
    <Animated.View style={[cardStyles.card, { opacity: fadeAnim, backgroundColor: theme.cardBackground }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[cardStyles.cardTitle, { color: theme.cardTextColor }]}>Anotação</Text>
        <TouchableOpacity onPress={desfavoritarAnotacao}>
          <MaterialIcons name="favorite" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>
      <Text style={[cardStyles.cardContent, { color: theme.textColor }]}>{anotacao.conteudo}</Text>
      {anotacao.tags?.length > 0 && (
        <View style={cardStyles.tagsContainer}>
          <Text style={[cardStyles.tagsTitle, { color: theme.textColor }]}>Tags:</Text>
          {anotacao.tags.map((tag, idx) => (
            <Text key={idx} style={[cardStyles.tag, { backgroundColor: theme.borderColor, color: theme.textColor }]}>{tag}</Text>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// --- COMPONENTE FAVORITOS SCREEN ---
const FavoritosScreen = () => {
  const { theme } = useContext(ThemeContext);

  const [favoritosTermos, setFavoritosTermos] = useState<string[]>([]);
  const [favoritosAnotacoes, setFavoritosAnotacoes] = useState<string[]>([]);
  const [termDetails, setTermDetails] = useState<Termo[]>([]);
  const [annotationDetails, setAnnotationDetails] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  useEffect(() => {
    const buscarUsuarioId = async () => {
      const id = await AsyncStorage.getItem("usuarioId");
      if (id) {
        setUsuarioId(id);
      } else {
        Alert.alert("Erro", "Usuário não autenticado");
        setLoading(false);
      }
    };
    buscarUsuarioId();
  }, []);

  useEffect(() => {
    const fetchFavoritos = async () => {
      if (!usuarioId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/favoritos/${usuarioId}`);
        const data = await response.json();
        setFavoritosTermos(data.termos || []);
        setFavoritosAnotacoes(data.anotacoes || []);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar seus favoritos.");
      } finally {
        setLoading(false);
      }
    };
    fetchFavoritos();
  }, [usuarioId]);

  useEffect(() => {
    const fetchTermDetails = async () => {
      if (!favoritosTermos.length) return setTermDetails([]);
      try {
        const terms = await Promise.all(
          favoritosTermos.map((id) =>
            fetch(`${API_BASE_URL}/dicionario/termos/${id}`).then((res) => res.json())
          )
        );
        setTermDetails(terms);
      } catch (error) {
        console.error("Erro ao buscar termos:", error);
      }
    };
    fetchTermDetails();
  }, [favoritosTermos]);

  useEffect(() => {
    const fetchAnnotationDetails = async () => {
      if (!favoritosAnotacoes.length) return setAnnotationDetails([]);
      try {
        const annotations = await Promise.all(
          favoritosAnotacoes.map((id) =>
            fetch(`${API_BASE_URL}/anotacoes/${id}`).then((res) => res.json())
          )
        );
        setAnnotationDetails(annotations);
      } catch (error) {
        console.error("Erro ao buscar anotações:", error);
      }
    };
    fetchAnnotationDetails();
  }, [favoritosAnotacoes]);

  const handleDesfavoritarTermo = (id: string) => {
    setFavoritosTermos(prev => prev.filter(tid => tid !== id));
    setTermDetails(prev => prev.filter(t => t.id !== id));
  };

  const handleDesfavoritarAnotacao = (id: string) => {
    setFavoritosAnotacoes(prev => prev.filter(aid => aid !== id));
    setAnnotationDetails(prev => prev.filter(a => a.id !== id));
  };

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.backgroundColor,
      },
      content: {
        padding: 20,
      },
      title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        alignSelf: "center",
        color: theme.textColor,
      },
      sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 10,
        color: theme.textColor,
      },
      emptyText: {
        fontSize: 16,
        color: theme.placeholderTextColor,
        fontStyle: "italic",
        textAlign: "center",
      },
      loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
    });
  }, [theme]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={
        <View style={styles.content}>
          <HeaderComum screenName="Favoritos" />
          <Text style={styles.title}>Seus conteúdos favoritos</Text>
          <Text style={styles.sectionTitle}>Termos Favoritos</Text>
          {termDetails.length === 0 && (
            <Text style={styles.emptyText}>Nenhum termo favorito.</Text>
          )}
        </View>
      }
      data={termDetails}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TermCard term={item} onDesfavoritar={handleDesfavoritarTermo} />
      )}
      ListFooterComponent={
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Anotações Favoritas</Text>
          {annotationDetails.length > 0 ? (
            annotationDetails.map(anotacao => (
              <AnnotationCard
                key={anotacao.id}
                anotacao={anotacao}
                onDesfavoritar={handleDesfavoritarAnotacao}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma anotação favorita.</Text>
          )}
        </View>
      }
    />
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff", // este valor é sobrescrito dinamicamente
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333", // será sobrescrito
  },
  cardSubtitle: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 5,
    color: "#666",
  },
  cardDefinition: {
    fontSize: 16,
    marginBottom: 5,
    color: "#444",
  },
  exampleContainer: {
    marginTop: 5,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#e0e0e0", // será sobrescrito
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 3,
    color: "#555",
  },
  cardExample: {
    fontSize: 14,
    marginBottom: 3,
    color: "#555",
  },
  cardContent: {
    fontSize: 16,
    marginTop: 5,
    marginBottom: 5,
    color: "#444", // será sobrescrito
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 10,
    color: "#555",
  },
  tag: {
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 14,
    color: "#333",
  },
});

export default FavoritosScreen;
