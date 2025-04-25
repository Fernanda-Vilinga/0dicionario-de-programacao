import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderAdmin from '../HeaderAdmin';
import API_BASE_URL from 'src/config';
import { ThemeContext } from 'src/context/ThemeContext';
import { Dimensions } from 'react-native';


interface Report {
  id?: string;
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
}

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Activity {
  id: string;
  description: string;
  time: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  online: boolean;
  lastLogin: string;
}

type ModalType = 'active' | 'recentAccess' | 'totalUsers' | null;

interface ReportCardProps extends Report {
  onPress?: () => void;
}

const windowHeight = Dimensions.get('window').height;
const ReportCard = ({ title, value, icon, color, onPress }: ReportCardProps) => {
  const { theme } = useContext(ThemeContext);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          stylesCard.card,
          { backgroundColor: theme.cardBackground, shadowColor: theme.cardShadow },
        ]}
      >
        <View style={[stylesCard.iconContainer, { backgroundColor: color }]}>
          <MaterialIcons name={icon as any} size={24} color="#fff" />
        </View>
        <View>
          <Text style={[stylesCard.cardTitle, { color: theme.cardTextColor }]}>{title}</Text>
          <Text style={[stylesCard.cardValue, { color: theme.cardTextColor }]}>{value}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const stylesCard = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    minWidth: 200,
    // Em web, o box shadow pode ajudar a marcar o cartão
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: { fontSize: 16 },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
});

const AdminDashboardScreen = () => {
  const { theme } = useContext(ThemeContext);

  const [reports, setReports] = useState<Report[]>([]);
  const [activeUsers, setActiveUsers] = useState<RecentUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<RegisteredUser[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalType, setModalType] = useState<ModalType>(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`);
      const data = await response.json();
      setReports(data.reports);
      setActiveUsers(data.activeUsers);
      setTotalUsers(data.totalUsers);
      setRecentUsers(data.recentUsers);
      setRecentRegistrations(data.recentRegistrations);
      setActivities(data.recentActivities);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Usamos useMemo para recriar os estilos com base no tema atual
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      </View>
    );
  }

  const handleCardPress = (report: Report) => {
    const titleLower = report.title.toLowerCase();
    if (titleLower.includes('ativos')) {
      setModalType('active');
    } else if (titleLower.includes('acessos')) {
      setModalType('recentAccess');
    } else if (titleLower.includes('total')) {
      setModalType('totalUsers');
    }
  };

  // Função para renderizar lista de usuários
  const renderUserList = (
    users: Array<{ id: string; name: string; email: string; lastLogin: string; online?: boolean }>
  ) => (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      nestedScrollEnabled={true}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={({ item }) => (
        <View style={styles.modalListItem}>
          <Text style={styles.modalListText}>{item.name}</Text>
          <Text style={styles.modalListSubText}>{item.email}</Text>
          <Text style={styles.modalListSubText}>Último Login: {item.lastLogin}</Text>
          {item.online !== undefined && (
            <Text style={styles.modalListSubText}>
              Status: {item.online ? 'Online' : 'Offline'}
            </Text>
          )}
        </View>
      )}
    />
  );

  const renderRecentUserList = (users: RecentUser[]) => (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      nestedScrollEnabled={true}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={({ item }) => (
        <View style={styles.modalListItem}>
          <Text style={styles.modalListText}>{item.name}</Text>
          <Text style={styles.modalListSubText}>{item.email}</Text>
          <Text style={styles.modalListSubText}>Último Acesso: {item.lastLogin}</Text>
        </View>
      )}
    />
  );

  const renderRecentRegistrations = (users: RegisteredUser[]) => (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      nestedScrollEnabled={true}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={({ item }) => (
        <View style={styles.modalListItem}>
          <Text style={styles.modalListText}>{item.name}</Text>
          <Text style={styles.modalListSubText}>{item.email}</Text>
          <Text style={styles.modalListSubText}>Registrado em: {item.createdAt}</Text>
        </View>
      )}
    />
  );

  const renderActivitiesList = (activities: Activity[]) => (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      nestedScrollEnabled={true}
      contentContainerStyle={{ paddingBottom: 20 }}
      renderItem={({ item }) => (
        <View style={styles.modalListItem}>
          <Text style={styles.modalListText}>{item.description}</Text>
          <Text style={styles.modalListSubText}>Hora: {item.time}</Text>
        </View>
      )}
    />
  );

  const renderModalContent = () => {
    switch (modalType) {
      case 'active':
        return renderUserList(activeUsers);
      case 'recentAccess':
        return renderRecentUserList(recentUsers);
      case 'totalUsers':
        return renderUserList(totalUsers);
      default:
        return null;
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        // Para web, o uso de overflow pode ajudar a garantir a rolagem
        contentContainerStyle={{
          paddingBottom: 20,
          paddingTop: 10,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
      >
        <HeaderAdmin screenName="Relatórios de Atividades" />
        <FlatList
          data={reports}
          keyExtractor={(item, index) => (item.id ? item.id : String(index))}
          renderItem={({ item }) => (
            <ReportCard {...item} onPress={() => handleCardPress(item)} />
          )}
          contentContainerStyle={styles.listContainer}
          horizontal
          showsHorizontalScrollIndicator={true}
        />
       <Text style={styles.sectionTitle}>Últimos Cadastros</Text>
{recentRegistrations && recentRegistrations.length > 0 ? (
  renderRecentRegistrations(recentRegistrations)
) : (
  <Text style={styles.noRecordsText}>Sem registos</Text>
)}

        <Text style={styles.sectionTitle}>Atividades Recentes</Text>
        {renderActivitiesList(activities)}
      </ScrollView>
      <Modal visible={!!modalType} animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalContent}>
          <Pressable style={styles.closeButton} onPress={() => setModalType(null)}>
            <Text style={{ fontSize: 18, color: theme.buttonBackground }}>Fechar</Text>
          </Pressable>
          {renderModalContent()}
        </View>
      </Modal>
    </>
  );
};

// Cria estilos dinâmicos com base no tema atual
const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      backgroundColor: theme.dashboardBackground,
      overflow: 'scroll',
      minHeight: windowHeight,
    },
    listContainer: {
      gap: 16,
      paddingVertical: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
      color: theme.dashboardTextColor,
    },
    modalContent: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.dashboardBackground,
    },
    modalListItem: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: theme.borderColor,
    },
    modalListText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.dashboardTextColor,
    },
    modalListSubText: {
      fontSize: 14,
      color: theme.placeholderTextColor,
    },
    closeButton: {
      alignSelf: 'flex-end',
      marginBottom: 10,
    },    noRecordsText: {
      fontSize: 16,
      color: theme.placeholderTextColor,
     
      marginVertical: 20,
    },
  });

export default AdminDashboardScreen;
