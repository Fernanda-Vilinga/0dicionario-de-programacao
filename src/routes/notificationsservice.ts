import db from '../firebaseConfig';
import admin from 'firebase-admin';

/**
 * Registra um log de atividade na coleção 'atividades'.
 */
export async function registrarAtividade(
  userId: string,
  descricao: string,
  acao: string
): Promise<void> {
  const timestamp = admin.firestore.Timestamp.now();
  await db.collection('atividades').add({
    userId,
    description: descricao,
    action: acao,
    createdAt: timestamp
  });
}

/**
 * Envia notificações para múltiplos usuários em batch.
 */
export async function distribuirNotificacao(
  recipients: string[],
  type: string,
  message: string
): Promise<void> {
  const batch = db.batch();
  const timestamp = admin.firestore.Timestamp.now();
  for (const userId of recipients) {
    const ref = db.collection('notifications').doc();
    batch.set(ref, {
      userId,
      type,
      message,
      createdAt: timestamp,
      read: false
    });
  }
  await batch.commit();
}


/**
 * Busca notificações de um usuário (ordenadas por data desc).
 */
export async function fetchNotifications(userId: string) {
  const snap = await db
    .collection('notifications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Marca todas as notificações de um usuário como lidas.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const snap = await db
    .collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();

  const batch = db.batch();
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  if (!snap.empty) {
    await batch.commit();
  }
}

/**
 * Marca uma única notificação como lida.
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  await db.collection('notifications').doc(id).update({ read: true });
}

/**
 * Marca uma única notificação como não lida.
 */
export async function markNotificationAsUnread(id: string): Promise<void> {
  await db.collection('notifications').doc(id).update({ read: false });
}

/**
 * Retorna lista de userIds para todos os usuários com o role especificado.
 */
export async function buscarUsuariosPorRole(role: string): Promise<string[]> {
  // Firestore armazena em maiúsculo: "USER", "MENTOR", "ADMIN"
  const tipo = role.toUpperCase();

  const snap = await db
    .collection('usuarios')
    .where('tipo_de_usuario', '==', tipo)
    .get();

  return snap.docs.map(doc => doc.id);
}
