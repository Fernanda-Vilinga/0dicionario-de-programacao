/* src/utils/pushService.ts */
import db from '../firebaseConfig';
import admin from 'firebase-admin';

/**
 * Envia uma notificação push para o usuário especificado.
 * Busca o token armazenado na coleção 'tokens'.
 * @param usuarioId  ID do usuário no Firestore
 * @param title      Título da notificação
 * @param body       Corpo da notificação
 * @param data       Dados extras (payload) opcionais
 */
export async function sendPushNotification(
  usuarioId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  try {
    // Recupera o token do usuário
    const tokenDoc = await db.collection('tokens').doc(usuarioId).get();
    if (!tokenDoc.exists) {
      console.warn(`Nenhum token encontrado para usuário ${usuarioId}`);
      return;
    }

    const { token } = tokenDoc.data()!;

    // Envia notificação via Firebase Admin
    await admin.messaging().send({
      token,
      notification: { title, body },
      data
    });
  } catch (error) {
    console.error(`Erro ao enviar push para ${usuarioId}:`, error);
  }
}
