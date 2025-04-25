import React, { useEffect, useState, useContext, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator 
} from 'react-native';
import HeaderComum from '../HeaderComum';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from 'src/config';
import { ThemeContext } from 'src/context/ThemeContext';

interface Atividade {
  id: string;
  description: string;
  time: string;
}

// Função para buscar as atividades do usuário
const buscarAtividadesDoUsuario = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/user/${userId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar atividades');
    }
    const data = await response.json();
    return data.activities;
  } catch (error) {
    console.error('Erro ao carregar atividades:', error);
    return [];
  }
};

const HistoricoScreen = () => {
  const { theme } = useContext(ThemeContext);

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarAtividades = async () => {
    try {
      const userId = await AsyncStorage.getItem('usuarioId');
      if (!userId) {
        console.error('Usuário não autenticado');
        return;
      }
      const atividades = await buscarAtividadesDoUsuario(userId);
      setAtividades(atividades);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAtividades();
  }, []);

  const styles = useMemo(() => 
    StyleSheet.create({
      header: {
        backgroundColor: theme.backgroundColor,
        paddingTop: 20,
      },
      container: {
        flex: 1,
        padding: 20,
        backgroundColor: theme.backgroundColor,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.textColor,
        alignSelf: 'center',
      },
      itemContainer: {
        backgroundColor: theme.cardBackground,
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: theme.borderColor,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 3,
      },
      item: {
        fontSize: 16,
        color: theme.textColor,
      },
      time: {
        fontSize: 14,
        color: theme.placeholderTextColor,
        marginTop: 4,
      },
    }), [theme]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <HeaderComum screenName="Histórico" />
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Vê suas últimas atividades!</Text>
        {loading ? (
          <ActivityIndicator size="large" color={theme.buttonBackground} />
        ) : (
          <FlatList
            data={atividades}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <Text style={styles.item}>{item.description}</Text>
                <Text style={styles.time}>às {item.time}</Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>
    </View>
  );
};

export default HistoricoScreen;
