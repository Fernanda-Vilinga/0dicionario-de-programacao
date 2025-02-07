import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderHomes from '../HeaderHomes';

const reports = [
  { id: '1', title: 'Usuários Ativos', value: '150', icon: 'person', color: '#2979FF' },
  { id: '2', title: 'Total de Vendas', value: '50.000 Kzs', icon: 'attach-money', color: '#4CAF50' },
  { id: '3', title: 'Acessos Recentes', value: 'Mikelina, Makiesse, Eidi...', icon: 'visibility', color: '#FF9800' },
];

const recentUsers = [
  { id: '1', name: 'Paulo Capitão', date: '05/02/2025' },
  { id: '2', name: 'Carlos Lucamba', date: '04/02/2025' },
  { id: '3', name: 'Isabel Siengue', date: '03/02/2025' },
];

const activities = [
  { id: '1', description: 'Makelina fez login', time: 'Há 5 min' },
  { id: '2', description: 'Tamara adicionou uma sugestão', time: 'Há 15 min' },
  { id: '3', description: 'Carlos respondeu um quiz', time: 'Há 30 min' },
];

const ReportCard = ({ title, value, icon, color }: any) => (
  <View style={styles.card}>
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <MaterialIcons name={icon} size={24} color="#fff" />
    </View>
    <View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  </View>
);

const AdminDashboardScreen = () => {
  return (
    <View style={styles.container}>
      <HeaderHomes screenName="Relatórios de Atividades" />

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReportCard {...item} />}
        contentContainerStyle={styles.listContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimos Cadastros</Text>
        {recentUsers.map((user) => (
          <View key={user.id} style={styles.listItem}>
            <Text style={styles.listText}>{user.name}</Text>
            <Text style={styles.dateText}>{user.date}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atividades Recentes</Text>
        {activities.map((activity) => (
          <View key={activity.id} style={styles.listItem}>
            <Text style={styles.listText}>{activity.description}</Text>
            <Text style={styles.dateText}>{activity.time}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.refreshButton}>
        <MaterialIcons name="refresh" size={24} color="#fff" />
        <Text style={styles.refreshText}>Atualizar Dados</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: { padding: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 4,
    elevation: 3,
    marginRight: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardValue: { fontSize: 14, color: '#555' },
  section: { padding: 20, backgroundColor: '#fff', marginVertical: 10, borderRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom:5 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  listText: { fontSize: 16, color: '#333' },
  dateText: { fontSize: 14, color: 'gray' },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#2979FF',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: { color: '#fff', fontSize: 16, marginLeft: 10 },
});

export default AdminDashboardScreen;

