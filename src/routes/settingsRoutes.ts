import { FastifyInstance } from 'fastify';
import db from '../firebaseConfig';
export default async function settingsRoutes(app: FastifyInstance) {
    app.get('/configuracoes/:id', async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        const configDoc = await db.collection('configuracoes').doc(id).get();
        return configDoc.exists ? reply.send(configDoc.data()) : reply.status(404).send({ message: 'Configurações não encontradas' });
      } catch (error) {
        return reply.status(500).send({ message: 'Erro ao buscar configurações' });
      }
    });
  }
  