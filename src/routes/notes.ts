import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

// Tipagem para o corpo da requisição POST
interface SalvarNotaBody {
  usuarioId: string;
  conteudo: string;
  tags?: string[];  // Tags são opcionais
}

export default async function notasRoutes(app: FastifyInstance) {
  // Rota para salvar uma nova anotação
  app.post('/notas', async (req: FastifyRequest<{ Body: SalvarNotaBody }>, reply: FastifyReply) => {
    const { usuarioId, conteudo, tags } = req.body;

    if (!usuarioId || !conteudo) {
      return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
    }

    try {
      const newNote = await db.collection('notas').add({
        usuarioId,
        conteudo,
        tags,
        dataCriacao: new Date(),
      });

      return reply.status(201).send({ message: 'Nota salva com sucesso.', id: newNote.id });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao salvar anotação.' });
    }
  });
}
