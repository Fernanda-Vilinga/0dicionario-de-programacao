import { FastifyInstance } from 'fastify';
import db from '../firebaseConfig';
export default async function favoritesRoutes(app: FastifyInstance) {
    app.get('/favoritos/:id', async (req, reply) => {
      const { id } = req.params as { id: string };
      try {
        const favoritosSnapshot = await db.collection('favoritos').where('usuarioId', '==', id).get();
        const favoritos = favoritosSnapshot.docs.map(doc => doc.data());
        return reply.send(favoritos);
      } catch (error) {
        return reply.status(500).send({ message: 'Erro ao buscar favoritos' });
      }
    });
  }