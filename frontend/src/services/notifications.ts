// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from '../config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

// Configura handler para notificações em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Solicita permissão, obtém o Expo Push Token,
 * salva no Firestore e retorna o token.
 */
export async function registerForPushNotificationsAsync(
  userId: string
): Promise<string | null> {
  let token: string | null = null;

  if (!Device.isDevice) {
    console.log('Use um dispositivo físico para notificações push.');
    return null;
  }

  // 1. Permissão
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Permissão de notificações negada!');
    return null;
  }

  // 2. Obter token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  token = tokenData.data;
  console.log('Expo Push Token:', token);

  // 3. Salvar token no Firestore (subcoleção pushTokens)
  if (userId && token) {
    try {
      await setDoc(
        doc(db, 'users', userId, 'pushTokens', token),
        {
          token,
          platform: Platform.OS,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Erro ao salvar token no Firestore:', error);
    }
  }

  // 4. Configurar canal no Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token ?? null;
}
