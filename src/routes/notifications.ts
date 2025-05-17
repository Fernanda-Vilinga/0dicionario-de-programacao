// src/routes/notificationsRoutes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';
import admin from 'firebase-admin';

export default async function notificationsRoutes(app: FastifyInstance) {
  // Listar notificações de um usuário
  app.get('/notifications/user/:userId', async (req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    const { userId } = req.params;
    try {
      const snap = await db
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const notifications = snap.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          message: data.message,
          read: data.read,
          createdAt: data.createdAt.toDate().toISOString(),
        };
      });

      return reply.send({ notifications });
    } catch (err) {
      console.error('Erro ao listar notifications:', err);
      return reply.status(500).send({ message: 'Erro interno' });
    }
  });

  // Marcar uma notificação como lida
  app.put('/notifications/:id/read', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = req.params;
    try {
      await db.collection('notifications').doc(id).update({ read: true });
      return reply.send({ ok: true });
    } catch (err) {
      console.error('Erro ao marcar read:', err);
      return reply.status(500).send({ message: 'Erro interno' });
    }
  });

  // Marcar uma notificação como não-lida
  app.put('/notifications/:id/unread', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = req.params;
    try {
      await db.collection('notifications').doc(id).update({ read: false });
      return reply.send({ ok: true });
    } catch (err) {
      console.error('Erro ao marcar unread:', err);
      return reply.status(500).send({ message: 'Erro interno' });
    }
  });

  // Marcar todas como lidas
  app.put('/notifications/user/:userId/readAll', async (req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    const { userId } = req.params;
    try {
      const snap = await db
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      const batch = db.batch();
      snap.docs.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();

      return reply.send({ ok: true });
    } catch (err) {
      console.error('Erro ao readAll:', err);
      return reply.status(500).send({ message: 'Erro interno' });
    }
  });
}

