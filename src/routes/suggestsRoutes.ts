import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

// Definição da tipagem do corpo da requisição
interface SugestaoBody {
  usuarioId: string;
  sugestao: string;
}

export default async function suggestionsRoutes(app: FastifyInstance) {
  app.post('/sugestoes', async (req: FastifyRequest<{ Body: SugestaoBody }>, reply: FastifyReply) => {
    const { usuarioId, sugestao } = req.body;

    if (!usuarioId || !sugestao) {
      return reply.status(400).send({ message: 'Usuário e sugestão são obrigatórios.' });
    }

    try {
      await db.collection('sugestoes').add({
        usuarioId,
        sugestao,
        dataCriacao: new Date(),
      });

      return reply.status(201).send({ message: 'Sugestão enviada com sucesso' });
    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      return reply.status(500).send({ message: 'Erro ao enviar sugestão' });
    }
  });
}
