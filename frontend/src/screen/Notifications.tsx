import React, { useState, useCallback, useContext, useEffect } from "react";
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
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationLoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<NotificationLoc | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 1️⃣ Ler apenas o flag salvo em SettingsScreen
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("notificationsEnabled");
      setNotificationsEnabled(stored === null ? true : stored === "true");
    })();
  }, []);

  // 2️⃣ Função que limpa ou busca notificações
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    if (!notificationsEnabled) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      Alert.alert("Erro", "Falha ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }, [notificationsEnabled]);

  // 3️⃣ Sempre que o flag mudar, recarrega (ou limpa)
  useEffect(() => {
    loadNotifications();
  }, [notificationsEnabled, loadNotifications]);

  // 4️⃣ Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // 5️⃣ Volta ao foco só recarrega se habilitado
  useFocusEffect(
    useCallback(() => {
      if (notificationsEnabled) loadNotifications();
    }, [notificationsEnabled, loadNotifications])
  );

  // 6️⃣ Marcar individual como lido e abrir modal de detalhe
  const handlePress = async (item: NotificationLoc) => {
    if (!item.read) {
      await markNotificationAsRead(item.id);
      await loadNotifications();
    }
    const userId = await AsyncStorage.getItem("usuarioId");
    if (item.type === "Atualizar perfil" && item.actorId !== userId) {
      setDetailLoading(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/perfil/${item.actorId}`);
        if (!resp.ok) throw new Error();
        setProfileData((await resp.json()) as UserProfile);
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

  // 7️⃣ Marcar todas como lidas
  const handleMarkAll = async () => {
    setLoading(true);
    const ok = await markAllNotificationsAsRead();
    if (!ok) Alert.alert("Erro", "Falha ao marcar todas como lidas.");
    await loadNotifications();
  };

  // 8️⃣ Agrupar por data
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
      (groups[label] ||= []).push(n);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  // 9️⃣ Spinner inicial
  if (loading) {
    return (
      <ActivityIndicator
        style={styles.center}
        size="large"
        color={theme.primaryColor}
      />
    );
  }

  // 🔟 Se desativado, retorna só header + mensagem
  if (!notificationsEnabled) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <Header screenName="Notificações" />
        <Text style={[styles.disabledText, { color: theme.textColorSecondary }]}>
          Notificações desativadas. Ative em Definições.
        </Text>
      </View>
    );
  }

  // 1️⃣1️⃣ Notificações habilitadas: renderiza filtros, lista e modal
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Header screenName="Notificações" />

      <TouchableOpacity onPress={handleMarkAll}>
        <Text style={[styles.markAllText, { color: theme.primaryColor }]}>
          Marcar todas como lidas
        </Text>
      </TouchableOpacity>

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
              <Text
                style={[
                  styles.tabText,
                  { color: active ? theme.primaryColor : theme.textColor },
                ]}
              >
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: theme.cardBackground }]}
            onPress={() => handlePress(item)}
          >
            <Text style={[styles.title, { color: theme.textColor }]}>{item.type}</Text>
            <Text
              style={[styles.body, { color: theme.textColorSecondary }]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
            <Text style={[styles.date, { color: theme.textColorSecondary }]}>
              {new Date(item.createdAt).toLocaleTimeString("pt-BR")}
            </Text>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.header, { color: theme.textColor }]}>{section.title}</Text>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Nenhuma notificação</Text>
        )}
      />

      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.backgroundColor }]}>
            {detailLoading ? (
              <ActivityIndicator size="large" color={theme.primaryColor} />
            ) : (
              <ScrollView contentContainerStyle={styles.detailContainer}>
                {selected?.type === "Atualizar perfil" && profileData ? (
                  <>
                    <Image
                      source={{ uri: profileData.profileImage }}
                      style={styles.profileImage}
                    />
                    <Text style={[styles.detailName, { color: theme.textColor }]}>
                      {profileData.nome}
                    </Text>
                    <Text
                      style={[
                        styles.detailBio,
                        { color: theme.textColorSecondary },
                      ]}
                    >
                      {profileData.bio}
                    </Text>
                    <Text
                      style={[
                        styles.detailTimestamp,
                        { color: theme.textColorSecondary },
                      ]}
                    >
                      Atualizado em:{" "}
                      {new Date(selected.createdAt).toLocaleString("pt-BR")}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.detailMessage, { color: theme.textColor }]}>
                      {selected?.message}
                    </Text>
                    <Text
                      style={[
                        styles.detailTimestamp,
                        { color: theme.textColorSecondary },
                      ]}
                    >
                      {selected?.createdAt
                        ? new Date(selected.createdAt).toLocaleString("pt-BR")
                        : ""}
                    </Text>
                  </>
                )}
                <View style={styles.closeBtn}>
                  <Button
                    title="Fechar"
                    color={theme.primaryColor}
                    onPress={() => setSelected(null)}
                  />
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
  disabledText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    fontStyle: "italic",
  },
  markAllText: {
    textAlign: "center",
    padding: 8,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    fontStyle: "italic",
  },
  item: {
    padding: 15,
    marginVertical: 6,
    borderRadius: 10,
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    maxHeight: "80%",
    borderRadius: 12,
    padding: 20,
  },
  detailContainer: { alignItems: "center" },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  detailName: { fontSize: 18, fontWeight: "bold" },
  detailBio: { fontSize: 14, marginVertical: 8, textAlign: "center" },
  detailMessage: { fontSize: 16, marginBottom: 12 },
  detailTimestamp: { fontSize: 12, opacity: 0.7 },
  closeBtn: { marginTop: 10, alignSelf: "stretch" },
});

export default NotificationScreen;
