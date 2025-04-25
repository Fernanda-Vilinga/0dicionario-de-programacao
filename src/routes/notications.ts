import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';
import admin from 'firebase-admin';

interface TokenBody {
  usuarioId: string;
  token: string;
}

interface NotifyBody {
  usuarioId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export default async function notificationRoutes(app: FastifyInstance) {
  // Registrar token push
  app.post('/tokens', async (req: FastifyRequest<{ Body: TokenBody }>, reply: FastifyReply) => {
    const { usuarioId, token } = req.body;
    if (!usuarioId || !token) {
      return reply.status(400).send({ message: 'usuarioId e token são obrigatórios.' });
    }
    await db.collection('tokens').doc(usuarioId).set({ token });
    return reply.send({ message: 'Token registrado.' });
  });

  // Remover token no logout
  app.delete('/tokens/:usuarioId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { usuarioId } = req.params as { usuarioId: string };
    await db.collection('tokens').doc(usuarioId).delete();
    return reply.send({ message: 'Token removido.' });
  });

  // Enviar notificação manual via backend
  app.post('/notificar', async (req: FastifyRequest<{ Body: NotifyBody }>, reply: FastifyReply) => {
    const { usuarioId, title, body, data } = req.body;
    const tokenDoc = await db.collection('tokens').doc(usuarioId).get();
    if (!tokenDoc.exists) {
      return reply.status(404).send({ message: 'Token não encontrado.' });
    }
    const { token } = tokenDoc.data()!;
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: data || {}
    });
    return reply.send({ success: true });
  });
}