import React, { useEffect, useState } from 'react';
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

const ReportCard = ({ title, value, icon, color, onPress }: ReportCardProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialIcons name={icon as any} size={24} color="#fff" />
      </View>
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const AdminDashboardScreen = () => {
  // Estados para os dados da rota
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
      // Armazena os dados retornados
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2979FF" />
      </View>
    );
  }

  // Determina qual modal exibir com base no título do relatório clicado
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

  // Renderiza o conteúdo do modal de acordo com o modalType
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

  // Função genérica para renderizar listas de usuários (para activeUsers e totalUsers)
  const renderUserList = (
    users: Array<{ id: string; name: string; email: string; lastLogin: string; online?: boolean }>
  ) => (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.modalListItem}>
          <Text style={styles.modalListText}>{item.name}</Text>
          <Text style={styles.modalListSubText}>{item.email}</Text>
          <Text style={styles.modalListSubText}>Último Login: {item.lastLogin}</Text>
          {item.online !== undefined && (
            <Text style={styles.modalListSubText}>Status: {item.online ? 'Online' : 'Offline'}</Text>
          )}
        </View>
      )}
    />
  );

  // Renderiza a lista de usuários recentes (acessos recentes)
  const renderRecentUserList = (users: RecentUser[]) => (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.modalListItem}>
          <Text style={styles.modalListText}>{item.name}</Text>
          <Text style={styles.modalListSubText}>{item.email}</Text>
          <Text style={styles.modalListSubText}>Último Acesso: {item.lastLogin}</Text>
        </View>
      )}
    />
  );

  // Renderiza a lista de recentes registros (Últimos Cadastros)
  const renderRecentRegistrations = (users: RegisteredUser[]) => (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.modalListItem}>
          <Text style={styles.modalListText}>{item.name}</Text>
          <Text style={styles.modalListSubText}>{item.email}</Text>
          <Text style={styles.modalListSubText}>Registrado em: {item.createdAt}</Text>
        </View>
      )}
    />
  );

  // Renderiza a lista de atividades recentes
  const renderActivitiesList = (activities: Activity[]) => (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.modalListItem}>
          <Text style={styles.modalListText}>{item.description}</Text>
          <Text style={styles.modalListSubText}>Hora: {item.time}</Text>
        </View>
      )}
    />
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 10, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
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
          showsHorizontalScrollIndicator={false}
        />

        <Text style={styles.sectionTitle}>Últimos Cadastros</Text>
        {renderRecentRegistrations(recentRegistrations)}

        <Text style={styles.sectionTitle}>Atividades Recentes</Text>
        {renderActivitiesList(activities)}
      </ScrollView>

      <Modal visible={!!modalType} animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalContent}>
          <Pressable style={styles.closeButton} onPress={() => setModalType(null)}>
            <Text style={{ fontSize: 18, color: '#2979FF' }}>Fechar</Text>
          </Pressable>
          {renderModalContent()}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: '#fff' },
  listContainer: { gap: 16, paddingVertical: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    minWidth: 200,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: { fontSize: 16, color: '#333' },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  modalContent: { flex: 1, padding: 16, backgroundColor: '#fff' },
  modalListItem: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  modalListText: { fontSize: 16, fontWeight: '500' },
  modalListSubText: { fontSize: 14, color: '#666' },
  closeButton: { alignSelf: 'flex-end', marginBottom: 10 },
});

export default AdminDashboardScreen;
