import React, { useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Button,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "src/config";
import { ThemeContext } from "src/context/ThemeContext";
import Header from "./HeaderComum";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationLoc,
} from "src/services/notifications";

// Dados de perfil
interface UserProfile {
  nome: string;
  bio: string;
  profileImage: string;
}

type FilterType = "all" | "unread" | "read";
const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "unread", label: "Não lidas" },
  { key: "read", label: "Lidas" },
];

const NotificationScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState<NotificationLoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<NotificationLoc | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      Alert.alert("Erro", "Falha ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handlePress = async (item: NotificationLoc) => {
    if (!item.read) {
      await markNotificationAsRead(item.id);
      loadNotifications();
    }

    const loggedUserId = await AsyncStorage.getItem("usuarioId");

    if (item.type === "Atualizar perfil" && item.actorId && item.actorId !== loggedUserId) {
      setDetailLoading(true);
      try {
        const url = `${API_BASE_URL}/perfil/${item.actorId}`;
        const response = await fetch(url, {
          headers: {
            // Authorization se necessário
          },
        });
        if (!response.ok) throw new Error();
        const data: UserProfile = await response.json();
        setProfileData(data);
      } catch {
        Alert.alert("Erro", "Falha ao buscar dados do perfil.");
        setProfileData(null);
      } finally {
        setDetailLoading(false);
      }
    } else {
      setProfileData(null);
    }

    setSelected(item);
  };

  const handleMarkAll = async () => {
    setLoading(true);
    const ok = await markAllNotificationsAsRead();
    if (!ok) Alert.alert("Erro", "Falha ao marcar todas como lidas.");
    await loadNotifications();
  };

  const filtered = notifications.filter(n =>
    filter === "all" ? true : filter === "unread" ? !n.read : n.read
  );

  const sections = React.useMemo(() => {
    const groups: Record<string, NotificationLoc[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    filtered.forEach(n => {
      const d = new Date(n.createdAt);
      let label = d.toLocaleDateString();
      if (d.toDateString() === today.toDateString()) label = "Hoje";
      else if (d.toDateString() === yesterday.toDateString()) label = "Ontem";
      groups[label] = groups[label] || [];
      groups[label].push(n);
    });

    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const renderItem = ({ item }: { item: NotificationLoc }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: theme.cardBackground }]}
      onPress={() => handlePress(item)}
    >
      <Text style={[styles.title, { color: theme.textColor }]}>{item.type}</Text>
      <Text style={[styles.body, { color: theme.textColorSecondary }]} numberOfLines={2}>
        {item.message}
      </Text>
      <Text style={[styles.date, { color: theme.textColorSecondary }]}>        
        {new Date(item.createdAt).toLocaleTimeString("pt-BR")}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={theme.primaryColor} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>  
      <Header screenName="Notificações" />
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleMarkAll}>
          <Text style={[styles.markAllText, { color: theme.primaryColor }]}>         
            Marcar todas como lidas
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        {FILTER_TABS.map(tab => {
          const count =
            tab.key === "all"
              ? notifications.length
              : notifications.filter(n => (tab.key === "unread" ? !n.read : n.read)).length;
          const active = filter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && { borderBottomColor: theme.primaryColor }]}
              onPress={() => setFilter(tab.key)}
            >
              <Text style={[styles.tabText, { color: active ? theme.primaryColor : theme.textColor }]}>               
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.header, { color: theme.textColor }]}>{section.title}</Text>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <Text style={{ color: theme.textColorSecondary, textAlign: "center", marginTop: 50 }}>
            Nenhuma notificação
          </Text>
        )}
      />

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.backgroundColor }]}>  
            {detailLoading ? (
              <ActivityIndicator size="large" color={theme.primaryColor} />
            ) : (
              <ScrollView contentContainerStyle={styles.detailContainer}>
                {selected?.type === "Atualizar perfil" && profileData ? (
                  <>                    
                    <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
                    <Text style={[styles.detailName, { color: theme.textColor }]}>                     
                      {profileData.nome}
                    </Text>
                    <Text style={[styles.detailBio, { color: theme.textColorSecondary }]}>                     
                      {profileData.bio}
                    </Text>
                    <Text style={[styles.detailTimestamp, { color: theme.textColorSecondary }]}>                     
                      Atualizado em: {new Date(selected.createdAt).toLocaleString("pt-BR")}
                    </Text>
                  </>
                ) : (
                  <>                    
                    <Text style={[styles.detailMessage, { color: theme.textColor }]}>                     
                      {selected?.message}
                    </Text>
                    <Text style={[styles.detailTimestamp, { color: theme.textColorSecondary }]}>                     
                      {new Date(selected?.createdAt || "").toLocaleString("pt-BR")}
                    </Text>
                  </>
                )}
                <View style={styles.closeBtn}>
                  <Button title="Fechar" color={theme.primaryColor} onPress={() => setSelected(null)} />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  actions: { alignItems: "flex-end", padding: 10 },
  markAllText: { fontSize: 14, fontWeight: "600" },
  tabs: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 14, fontWeight: "600" },
  list: { paddingHorizontal: 10, paddingBottom: 20 },
  item: {
    padding: 15,
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  body: { fontSize: 14, marginBottom: 4 },
  date: { fontSize: 12, opacity: 0.7, textAlign: "right" },
  header: { fontSize: 14, fontWeight: "bold", marginTop: 15, marginBottom: 5 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modal: { width: "85%", maxHeight: "80%", borderRadius: 12, padding: 20 },
  detailContainer: { alignItems: "center" },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  detailName: { fontSize: 18, fontWeight: "bold" },
  detailBio: { fontSize: 14, marginVertical: 8, textAlign: "center" },
  detailMessage: { fontSize: 16, marginBottom: 12 },
  detailTimestamp: { fontSize: 12, opacity: 0.7 },
  closeBtn: { marginTop: 10, alignSelf: "stretch" },
});

export default NotificationScreen;
