import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';
import { registrarAtividade, dispararEvento } from './notificationsservice';

interface Termo {
  id: string;
  termo: string;
  termo_lower: string;
  definicao: string;
  exemplos?: string[];
  linguagem?: string;
  categoria?: string;
}

interface TermoBody {
  termo: string;
  definicao: string;
  exemplos?: string[];
  linguagem?: string;
  categoria?: string;
}

interface TermoQuery {
  termo?: string;
  categoria?: string;
  linguagem?: string;
  ordem?: 'asc' | 'desc';
}

export default async function dicionarioRoutes(app: FastifyInstance) {

  // 🔍 Rota para buscar um termo específico
  app.get('/dicionario/termos', async (req: FastifyRequest<{ Querystring: TermoQuery }>, reply: FastifyReply) => {
    const { termo } = req.query;
    if (!termo) return reply.status(400).send({ message: 'Termo não fornecido.' });
    try {
      const termoLower = termo.toLowerCase();
      const termSnapshot = await db.collection('termos')
        .where('termo_array', 'array-contains', termoLower)
        .get();
      if (termSnapshot.empty) return reply.status(404).send({ message: 'Nenhum termo encontrado.' });
      const termos: Termo[] = termSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Termo,'id'>) }));
      return reply.send(termos);
    } catch (error) {
      console.error('Erro ao buscar termo:', error);
      return reply.status(500).send({ message: 'Erro ao buscar termo' });
    }
  });

  // 🔍 Rota para busca simples (substring search)
  app.get('/dicionario/termos/simples', async (req: FastifyRequest<{ Querystring: { termo?: string } }>, reply: FastifyReply) => {
    let { termo } = req.query;
    if (!termo) return reply.status(400).send({ message: 'Termo não fornecido.' });
    termo = termo.toLowerCase().trim();
    try {
      const snapshot = await db.collection('termos').get();
      if (snapshot.empty) return reply.status(404).send({ message: 'Nenhum termo encontrado.' });
      const termos: Termo[] = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Termo,'id'>) }));
      const resultado = termos.filter(t => t.termo_lower.includes(termo));
      if (resultado.length === 0) return reply.status(404).send({ message: 'Nenhum termo encontrado.' });
      return reply.send(resultado);
    } catch (error) {
      console.error('Erro ao buscar termo simples:', error);
      return reply.status(500).send({ message: 'Erro ao buscar termo simples' });
    }
  });

  // 📌 Rota para listar todos os termos cadastrados
  app.get('/dicionario/todos', async (_, reply) => {
    try {
      const snapshot = await db.collection('termos').get();
      if (snapshot.empty) return reply.send([]);
      const termos: Termo[] = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Termo,'id'>) }));
      return reply.send(termos);
    } catch (error) {
      console.error('Erro ao buscar todos os termos:', error);
      return reply.status(500).send({ message: 'Erro ao buscar os termos' });
    }
  });

  // GET one term by id
  app.get('/dicionario/termos/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const doc = await db.collection('termos').doc(id).get();
    if (!doc.exists) {
      return reply.status(404).send({ message: 'Termo não encontrado' });
    }
    return reply.send({ id: doc.id, ...doc.data() });
  });

  // ✅ Rota para adicionar um termo e registrar a atividade + notificação
  app.post('/dicionario/termo', async (req: FastifyRequest<{ Body: TermoBody }>, reply: FastifyReply) => {
    const { termo, definicao, exemplos, linguagem, categoria } = req.body;
    if (!termo || !definicao) return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
    try {
      const novoRef = await db.collection('termos').add({
        termo,
        termo_lower: termo.toLowerCase(),
        definicao,
        exemplos: exemplos || [],
        linguagem: linguagem || 'Geral',
        categoria: categoria || 'Sem categoria',
      });
      const userId = (req.headers['x-user-id'] as string) || 'sistema';
      const descricao = `O termo '${termo}' foi adicionado com sucesso ao dicionário.`;
      await registrarAtividade(userId, descricao, 'dicionario.adicionar');
      // Notificar todos usuários e admins
      await dispararEvento('dicionario.adicionar', userId, { termo });
      return reply.status(201).send({ message: 'Termo adicionado com sucesso.', id: novoRef.id });
    } catch (error) {
      console.error('Erro ao adicionar termo:', error);
      return reply.status(500).send({ message: 'Erro ao adicionar termo.' });
    }
  });

  // PUT: atualizar termo + notificação
  app.put('/dicionario/termo/:id', async (
    req: FastifyRequest<{ Params: { id: string }; Body: Partial<TermoBody> }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = (req.headers['x-user-id'] as string) || 'sistema';
    try {
      const ref = db.collection('termos').doc(id);
      const snap = await ref.get();
      if (!snap.exists) return reply.status(404).send({ message: 'Termo não encontrado.' });
      await ref.update({
        ...updates,
        termo_lower: updates.termo ? updates.termo.toLowerCase() : snap.data()?.termo_lower
      });
      const descricao = `Termo '${updates.termo || id}' atualizado com sucesso.`;
      await registrarAtividade(userId, descricao, 'dicionario.atualizar');
      // Notificar todos usuários e admins
      await dispararEvento('dicionario.atualizar', userId, { termo: updates.termo || '' });
      return reply.send({ message: 'Termo atualizado com sucesso.' });
    } catch (error) {
      console.error('Erro ao atualizar termo:', error);
      return reply.status(500).send({ message: 'Erro ao atualizar termo.' });
    }
  });

  // DELETE: remover termo (sem notificação)
  app.delete('/dicionario/termo/:id', async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const userId = (req.headers['x-user-id'] as string) || 'sistema';
    try {
      const ref = db.collection('termos').doc(id);
      const snap = await ref.get();
      if (!snap.exists) return reply.status(404).send({ message: 'Termo não encontrado.' });
      await ref.delete();
      const descricao = `Termo '${id}' removido com sucesso.`;
      await registrarAtividade(userId, descricao, 'dicionario.deletar');
      return reply.send({ message: 'Termo deletado com sucesso.' });
    } catch (error) {
      console.error('Erro ao deletar termo:', error);
      return reply.status(500).send({ message: 'Erro ao deletar termo.' });
    }
  });
}
