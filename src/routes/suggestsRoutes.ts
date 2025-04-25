import { FastifyInstance } from 'fastify';
import db from '../firebaseConfig';

// Função auxiliar para registrar atividade
export async function registrarAtividade(userId: string, descricao: string, acao: string) {
  try {
    await db.collection('atividades').add({
      userId,
      description: descricao,
      action: acao,
      createdAt: new Date(), // Usamos a data atual
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
  }
}

async function suggestsRoutes(app: FastifyInstance) {
  // 🔹 Enviar sugestão
  app.post('/sugestoes', async (request, reply) => {
    const { usuarioId, categoria, descricao, status } = request.body as any;

    if (!usuarioId || !categoria || !descricao) {
      return reply.status(400).send({ message: 'Dados inválidos' });
    }

    try {
      const novaSugestao = {
        usuarioId,
        categoria,
        descricao,
        status: status || 'pendente',
        data: new Date().toISOString(),
      };

      const docRef = await db.collection('sugestoes').add(novaSugestao);

      // Registra a atividade de envio de sugestão com mensagem natural
      const descAtividade = `Sugestão enviada com sucesso para a categoria "${categoria}".`;
      const acao = "Enviar Sugestão";
      await registrarAtividade(usuarioId, descAtividade, acao);

      return reply.status(201).send({ message: 'Sugestão recebida', id: docRef.id });
    } catch (error) {
      console.error('Erro ao enviar sugestão:', error);
      return reply.status(500).send({ message: 'Erro no servidor' });
    }
  });

  // 🔹 Listar sugestões
  app.get('/sugestoes', async (_, reply) => {
    try {
      const snapshot = await db.collection('sugestoes').get();
      const sugestoes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      return reply.status(200).send(sugestoes);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      return reply.status(500).send({ message: 'Erro ao buscar sugestões' });
    }
  });

  // 🔹 Atualizar status da sugestão
  app.put('/sugestoes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    if (!status) {
      return reply.status(400).send({ message: 'Status não informado' });
    }

    try {
      const docRef = db.collection('sugestoes').doc(id);
      await docRef.update({ status });

      // Registra a atividade de atualização de status com mensagem natural
      // Caso o usuário não esteja disponível no body, usa 'sistema'
      const usuarioId = (request.body as any).usuarioId || 'sistema';
      const descAtividade = `Status da sugestão atualizado para "${status}".`;
      const acao = "Atualizar Sugestão";
      await registrarAtividade(usuarioId, descAtividade, acao);

      return reply.status(200).send({ message: 'Status da sugestão atualizado' });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return reply.status(500).send({ message: 'Erro ao atualizar status' });
    }
  });
}

export default suggestsRoutes;
