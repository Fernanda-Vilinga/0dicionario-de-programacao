import API_BASE_URL from "src/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationLoc extends Notification {
  actorId: string; // ID de quem gerou a notificação
}

// Busca todas as notificações do usuário
export const fetchNotifications = async (): Promise<NotificationLoc[]> => {
  try {
    const userId = await AsyncStorage.getItem("usuarioId");
    if (!userId) throw new Error("Usuário não logado.");

    const response = await fetch(
      `${API_BASE_URL}/notifications/user/${userId}`
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erro ao buscar notificações.");

    // Mapeia o campo userId da resposta para actorId
    const notifications: NotificationLoc[] = (data.notifications || []).map((n: Notification & { userId: string }) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      createdAt: n.createdAt,
      read: n.read,
      actorId: n.userId,
    }));

    return notifications;
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return [];
  }
};

// Marca uma notificação específica como lida
export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${id}/read`,
      {
        method: "PUT",
      }
    );
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erro ao marcar notificação como lida.");
    }
    return true;
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return false;
  }
};

// Marca todas as notificações não lidas como lidas
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const userId = await AsyncStorage.getItem("usuarioId");
    if (!userId) throw new Error("Usuário não logado.");

    const response = await fetch(
      `${API_BASE_URL}/notifications/user/${userId}/readAll`,
      {
        method: "PUT",
      }
    );
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erro ao marcar todas as notificações como lidas.");
    }
    return true;
  } catch (error) {
    console.error("Erro ao marcar todas as notificações como lidas:", error);
    return false;
  }
};

// Conta quantas notificações não lidas existem
export const countUnreadNotifications = async (): Promise<number> => {
  try {
    const notifications = await fetchNotifications();
    return notifications.filter((n) => !n.read).length;
  } catch {
    return 0;
  }
};
