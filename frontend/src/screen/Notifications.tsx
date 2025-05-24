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
  Platform,
  useWindowDimensions,
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState<NotificationLoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<NotificationLoc | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Altura da viewport no web
  const { height: windowHeight } = useWindowDimensions();
  const listMaxHeight = windowHeight * 0.7;
  const modalScrollMaxHeight = windowHeight * 0.6;

  // carregar flag
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("notificationsEnabled");
      setNotificationsEnabled(stored == null ? true : stored === "true");
    })();
  }, []);

  // buscar notificações
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

  useEffect(() => {
    loadNotifications();
  }, [notificationsEnabled, loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (notificationsEnabled) loadNotifications();
    }, [notificationsEnabled, loadNotifications])
  );

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

  const handleMarkAll = async () => {
    setLoading(true);
    const ok = await markAllNotificationsAsRead();
    if (!ok) Alert.alert("Erro", "Falha ao marcar todas como lidas.");
    await loadNotifications();
  };

  // agrupar por data
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

  if (loading) {
    return (
      <ActivityIndicator
        style={styles.center}
        size="large"
        color={theme.primaryColor}
      />
    );
  }

  if (!notificationsEnabled) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        <Header screenName="Notificações" />
        <Text style={[styles.disabledText, { color: theme.textColor }]}>
          Notificações desativadas
        </Text>
      </View>
    );
  }

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
              : notifications.filter(n =>
                  tab.key === "unread" ? !n.read : n.read
                ).length;
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
            <Text style={[styles.title, { color: theme.textColor }]}>
              {item.type}
            </Text>
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
          <Text style={[styles.header, { color: theme.textColor }]}>
            {section.title}
          </Text>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 10,
          paddingBottom: 20,
          minHeight: 300,
        }}
        // @ts-ignore: overflowY é válido em web, mas não está no ViewStyle do RN
        style={
          Platform.OS === "web"
            ? { flex: 1, maxHeight: listMaxHeight, overflowY: "auto" } as any
            : { flex: 1 }
        }
        showsVerticalScrollIndicator
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
              <ScrollView
                // @ts-ignore: overflowY é válido em web, mas não está no ViewStyle do RN
                style={
                  Platform.OS === "web"
                    ? ({ maxHeight: modalScrollMaxHeight, overflowY: "auto" } as any)
                    : {}
                }
                contentContainerStyle={styles.detailContainer}
              >
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
                      style={[styles.detailBio, { color: theme.textColorSecondary }]}
                    >
                      {profileData.bio}
                    </Text>
                    <Text
                      style={[styles.detailTimestamp, { color: theme.textColorSecondary }]}
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
                      style={[styles.detailTimestamp, { color: theme.textColorSecondary }]}
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
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    fontStyle: "italic",
  },
  item: {
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: { fontWeight: "700", fontSize: 14, marginBottom: 4 },
  body: { fontSize: 13 },
  date: { fontSize: 11, marginTop: 6 },
  header: {
    fontWeight: "bold",
    fontSize: 15,
    paddingVertical: 6,
    paddingLeft: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  detailContainer: {
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  detailName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  detailBio: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  detailMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  detailTimestamp: {
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  closeBtn: {
    marginTop: 20,
    width: "100%",
  },
});

export default NotificationScreen;
