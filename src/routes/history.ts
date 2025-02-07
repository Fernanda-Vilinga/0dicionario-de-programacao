import { FastifyInstance } from 'fastify';
import db from '../firebaseConfig';
export default async function historyRoutes(app: FastifyInstance) {
    app.get('/historico/:id', async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        const historicoSnapshot = await db.collection('historico').where('usuarioId', '==', id).get();
        const historico = historicoSnapshot.docs.map(doc => doc.data());
        return reply.send(historico);
      } catch (error) {
        return reply.status(500).send({ message: 'Erro ao buscar histórico' });
      }
    });
  }
  