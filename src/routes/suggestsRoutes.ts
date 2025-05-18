import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';
import admin from 'firebase-admin';
import { registrarAtividade, dispararEvento } from './notificationsservice';

interface SugestaoBody {
  usuarioId: string;
  categoria: string;
  descricao: string;
}

export default async function suggestsRoutes(app: FastifyInstance) {
  // Enviar sugestão: usa dispararEvento para notificar autor e admins
  app.post(
    '/sugestoes',
    async (req: FastifyRequest<{ Body: SugestaoBody }>, reply: FastifyReply) => {
      const { usuarioId, categoria, descricao } = req.body;
      if (!usuarioId || !categoria || !descricao) {
        return reply.status(400).send({ message: 'Dados inválidos' });
      }
      try {
        const nova = {
          usuarioId,
          categoria,
          descricao,
          status: 'pendente',
          data: admin.firestore.Timestamp.now(),
        };
        const docRef = await db.collection('sugestoes').add(nova);

        // Registrar atividade e disparar evento
        const acao = 'sugestao.criar';
        const descricaoNot = `Você enviou uma sugestão para a categoria "${categoria}".`;
        await registrarAtividade(usuarioId, descricaoNot, acao);
        await dispararEvento(acao, usuarioId, { categoria, descricao, sugestaoId: docRef.id });

        return reply.status(201).send({ message: 'Sugestão recebida', id: docRef.id });
      } catch (error) {
        console.error('Erro ao enviar sugestão:', error);
        return reply.status(500).send({ message: 'Erro no servidor' });
      }
    }
  );

  // Listar sugestões
  app.get('/sugestoes', async (_, reply) => {
    try {
      const snapshot = await db.collection('sugestoes').get();
      const sugestoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return reply.status(200).send(sugestoes);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      return reply.status(500).send({ message: 'Erro ao buscar sugestões' });
    }
  });

  // Atualizar status da sugestão: usa dispararEvento para notificar autor e admins
  app.put(
    '/sugestoes/:id',
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return reply.status(400).send({ message: 'Status não informado' });
      }
      try {
        const ref = db.collection('sugestoes').doc(id);
        const snap = await ref.get();
        if (!snap.exists) {
          return reply.status(404).send({ message: 'Sugestão não encontrada' });
        }
        const orig = snap.data() as any;
        await ref.update({ status });

        const autor = orig.usuarioId;
        const acao = 'sugestao.atualizar';
        const descricaoNot = `Seu pedido de sugestão foi ${status}.`;
        await registrarAtividade(autor, descricaoNot, acao);
        await dispararEvento(acao, autor, { status, sugestaoId: id });

        return reply.status(200).send({ message: 'Status da sugestão atualizado' });
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        return reply.status(500).send({ message: 'Erro ao atualizar status' });
      }
    }
  );
}
