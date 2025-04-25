import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';

export function usePushNotification(onReceived: (notification: Notifications.Notification) => void) {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const [notificationCount, setNotificationCount] = useState(0);

  // Função para incrementar o contador de notificações
  const incrementNotificationCount = () => {
    setNotificationCount(prevCount => prevCount + 1);
  };

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notificação recebida:', notification);
      onReceived(notification);
      incrementNotificationCount(); // Incrementa o contador ao receber a notificação
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📲 Notificação clicada:', response);
      // Pode navegar para a tela correspondente
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return notificationCount; // Retorna o contador de notificações, se necessário
}
