import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';
import admin from 'firebase-admin';
import { registrarAtividade, distribuirNotificacao, buscarUsuariosPorRole } from './notificationsservice';

interface SugestaoBody {
  usuarioId: string;
  categoria: string;
  descricao: string;
  status?: string;
}

export default async function suggestsRoutes(app: FastifyInstance) {
  // Enviar sugestão: notifica admins
  app.post('/sugestoes', async (req: FastifyRequest<{ Body: SugestaoBody }>, reply: FastifyReply) => {
    const { usuarioId, categoria, descricao, status } = req.body;
    if (!usuarioId || !categoria || !descricao) {
      return reply.status(400).send({ message: 'Dados inválidos' });
    }
    try {
      const nova = {
        usuarioId,
        categoria,
        descricao,
        status: status || 'pendente',
        data: admin.firestore.Timestamp.now(),
      };
      const docRef = await db.collection('sugestoes').add(nova);

      // registrar atividade e notificação para o autor
      const descAtiv = `Sugestão enviada para categoria \"${categoria}\".`;
      const acao = 'Enviar Sugestão';
      await registrarAtividade(usuarioId, descAtiv, acao);
      await distribuirNotificacao([usuarioId], acao, descAtiv);

      // notificar todos os admins
      const admins = await buscarUsuariosPorRole('admin');
      const msgAdmin = `Nova sugestão na categoria \"${categoria}\" de ${usuarioId}.`;
      await distribuirNotificacao(admins, 'Nova Sugestão', msgAdmin);

      return reply.status(201).send({ message: 'Sugestão recebida', id: docRef.id });
    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      return reply.status(500).send({ message: 'Erro no servidor' });
    }
  });

  // Listar sugestões (sem notificações)
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

  // Atualizar status da sugestão: notifica autor
  app.put('/sugestoes/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: { status: string; usuarioId?: string } }>, reply: FastifyReply) => {
    const { id } = req.params;
    const { status, usuarioId: bodyUser } = req.body;
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

      const autor = orig.usuarioId || bodyUser || 'sistema';
      const descAtiv = `Status da sugestão atualizado para \"${status}\".`;
      const acao = 'Atualizar Sugestão';
      await registrarAtividade(autor, descAtiv, acao);
      await distribuirNotificacao([autor], acao, descAtiv);

      return reply.status(200).send({ message: 'Status da sugestão atualizado' });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return reply.status(500).send({ message: 'Erro ao atualizar status' });
    }
  });
}
