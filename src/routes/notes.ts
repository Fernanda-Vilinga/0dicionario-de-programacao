import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

interface SalvarNotaBody {
  usuarioId: string;
  conteudo: string;
  tags?: string[];
}

interface AtualizarNotaBody {
  conteudo?: string;
  tags?: string[];
}

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

export default async function notasRoutes(app: FastifyInstance) {
  // Adicionar CORS para permitir requisições do frontend
  app.addHook('onRequest', (req, reply, done) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    done();
  });

  // Criar uma nova anotação
  app.post('/notas', async (req: FastifyRequest<{ Body: SalvarNotaBody }>, reply: FastifyReply) => {
    console.log('Recebendo requisição POST em /notas:', req.body);

    const { usuarioId, conteudo, tags } = req.body;

    if (!usuarioId || !conteudo) {
      console.warn('Erro: Campos obrigatórios ausentes.');
      return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
    }

    try {
      const newNote = await db.collection('notas').add({
        usuarioId,
        conteudo,
        tags,
        dataCriacao: new Date(),
      });

      console.log('Nota criada com sucesso:', newNote.id);

      // Registra a atividade de criação de nota com mensagem natural
      const descricao = `Anotação criada com sucesso.`;

      const acao = "Criar Nota";
      await registrarAtividade(usuarioId, descricao, acao);

      return reply.status(201).send({ message: 'Nota salva com sucesso.', id: newNote.id });
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      return reply.status(500).send({ message: 'Erro ao salvar anotação.', error: String(error) });
    }
  });

  // Listar todas as anotações de um usuário
  app.get('/notas', async (req: FastifyRequest<{ Querystring: { usuarioId: string } }>, reply: FastifyReply) => {
    console.log('Recebendo requisição GET em /notas com query:', req.query);

    const { usuarioId } = req.query;

    if (!usuarioId) {
      console.warn('Erro: Usuário não informado.');
      return reply.status(400).send({ message: 'Usuário não informado.' });
    }

    try {
      const snapshot = await db.collection('notas').where('usuarioId', '==', usuarioId).get();

      if (snapshot.empty) {
        console.warn(`Nenhuma nota encontrada para o usuário: ${usuarioId}`);
     
        
        return reply.status(404).send({ message: 'Nenhuma nota encontrada.' });
      }

      const notas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`Notas encontradas para o usuário ${usuarioId}:`, notas);

      return reply.status(200).send(notas);
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      return reply.status(500).send({ message: 'Erro ao buscar notas.', error: String(error) });
    }
  });

  // 🔍 Buscar anotação por ID
  app.get('/anotacoes/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = req.params;

    if (!id) {
      return reply.status(400).send({ message: 'ID da anotação não fornecido.' });
    }

    try {
      const doc = await db.collection('notas').doc(id).get();

      if (!doc.exists) {
        return reply.status(404).send({ message: 'Anotação não encontrada.' });
      }

      return reply.send({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Erro ao buscar anotação por ID:', error);
      return reply.status(500).send({ message: 'Erro interno ao buscar anotação.', error: String(error) });
    }
  });

  // Atualizar uma anotação
  app.put('/notas/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: AtualizarNotaBody }>, reply: FastifyReply) => {
    console.log('Recebendo requisição PUT em /notas:', req.params, req.body);

    const { id } = req.params;
    const { conteudo, tags } = req.body;

    try {
      const notaRef = db.collection('notas').doc(id);
      const notaDoc = await notaRef.get();

      if (!notaDoc.exists) {
        console.warn(`Nota com ID ${id} não encontrada.`);
     
        
        return reply.status(404).send({ message: 'Nota não encontrada.' });
      }

      await notaRef.update({
        ...(conteudo && { conteudo }),
        ...(tags && { tags }),
      });
      console.log(`Nota ${id} atualizada com sucesso.`);

      // Registra a atividade de atualização de nota com mensagem natural
      const notaData = notaDoc.data();
      const usuarioId = notaData?.usuarioId || 'sistema';
      const descricao = `Anotação atualizada com sucesso.`;

      const acao = "Atualizar Nota";
      await registrarAtividade(usuarioId, descricao, acao);

      return reply.status(200).send({ message: 'Nota atualizada com sucesso.' });
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      return reply.status(500).send({ message: 'Erro ao atualizar nota.', error: String(error) });
    }
  });

  // Deletar uma anotação
  app.delete('/notas/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    console.log('Recebendo requisição DELETE em /notas:', req.params);

    const { id } = req.params;

    try {
      const notaRef = db.collection('notas').doc(id);
      const notaDoc = await notaRef.get();

      if (!notaDoc.exists) {
        console.warn(`Nota com ID ${id} não encontrada.`);


        return reply.status(404).send({ message: 'Nota não encontrada.' });
      }

      const notaData = notaDoc.data();
      const usuarioId = notaData?.usuarioId || 'sistema';

      await notaRef.delete();
      console.log(`Nota ${id} removida com sucesso.`);

      // Registra a atividade de deleção de nota com mensagem natural
      const descricao = `Anotação removida com sucesso.`;

      const acao = "Deletar Nota";
      await registrarAtividade(usuarioId, descricao, acao);

      return reply.status(200).send({ message: 'Nota removida com sucesso.' });
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      return reply.status(500).send({ message: 'Erro ao deletar nota.', error: String(error) });
    }
  });
}


