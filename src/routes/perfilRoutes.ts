import { FastifyInstance } from 'fastify';
import db from '../firebaseConfig';

export default async function profileRoutes(app: FastifyInstance) {
  app.get('/perfil/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const userDoc = await db.collection('usuarios').doc(id).get();
      if (!userDoc.exists) return reply.status(404).send({ message: 'Usuário não encontrado' });
      return reply.send(userDoc.data());
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao buscar perfil' });
    }
  });
}
