import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

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
  // 🔍 Rota para buscar um termo específico (prefix match + case sensitive)
  app.get('/dicionario/termos', async (req: FastifyRequest<{ Querystring: TermoQuery }>, reply: FastifyReply) => {
    let { termo } = req.query;
  
    if (!termo) {
      return reply.status(400).send({ message: 'Termo não fornecido.' });
    }
  
    try {
      const termoLower = termo.toLowerCase();
  
      // 🔥 Agora usamos `array-contains` para buscar termos começando com o que foi digitado
      const termRef = db.collection('termos').where('termo_array', 'array-contains', termoLower);
      const termSnapshot = await termRef.get();
  
      if (termSnapshot.empty) {
        return reply.status(404).send({ message: 'Nenhum termo encontrado.' });
      }
  
      const termos: Termo[] = termSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Termo, 'id'>,
      }));
  
      return reply.send(termos);
    } catch (error) {
      console.error("Erro ao buscar termo:", error);
      return reply.status(500).send({ message: 'Erro ao buscar termo' });
    }
  });
  
  // 🔍 Nova rota de pesquisa simples (substring search)
  // Exemplo: /dicionario/termos/simples?termo=co
  app.get('/dicionario/termos/simples', async (req: FastifyRequest<{ Querystring: { termo?: string } }>, reply: FastifyReply) => {
    let { termo } = req.query;
  
    if (!termo) {
      return reply.status(400).send({ message: 'Termo não fornecido.' });
    }
  
    termo = termo.toLowerCase().trim();
  
    try {
      // Busca todos os documentos na coleção
      const termSnapshot = await db.collection('termos').get();
  
      if (termSnapshot.empty) {
        return reply.status(404).send({ message: 'Nenhum termo encontrado.' });
      }
  
      let termos: Termo[] = termSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Termo, 'id'>,
      }));
  
      // Filtra os termos que contenham o substring informado
      const resultado = termos.filter(t => t.termo_lower && t.termo_lower.includes(termo));
  
      if (resultado.length === 0) {
        return reply.status(404).send({ message: 'Nenhum termo encontrado.' });
      }
  
      return reply.send(resultado);
    } catch (error) {
      console.error("Erro ao buscar termo simples:", error);
      return reply.status(500).send({ message: 'Erro ao buscar termo simples' });
    }
  });
  
  // 📌 Rota para listar todos os termos cadastrados
  app.get('/dicionario/todos', async (_, reply: FastifyReply) => {
    try {
      const termRef = db.collection('termos');
      const termSnapshot = await termRef.get();
  
      if (termSnapshot.empty) {
        return reply.send([]);
      }
  
      const termos: Termo[] = termSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Termo, 'id'>,
      }));
  
      return reply.send(termos);
    } catch (error) {
      console.error("Erro ao buscar todos os termos:", error);
      return reply.status(500).send({ message: 'Erro ao buscar os termos' });
    }
  });
  
  // ✅ Rota para adicionar um termo
  app.post('/dicionario/termo', async (req: FastifyRequest<{ Body: TermoBody }>, reply: FastifyReply) => {
    const { termo, definicao, exemplos, linguagem, categoria } = req.body;
  
    if (!termo || !definicao) {
      return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
    }
  
    try {
      const newTerm = await db.collection('termos').add({
        termo,
        termo_lower: termo.toLowerCase(), // Garante buscas insensíveis a maiúsculas/minúsculas
        definicao,
        exemplos: exemplos || [],
        linguagem: linguagem || 'Geral',
        categoria: categoria || 'Sem categoria',
      });
  
      return reply.status(201).send({ message: 'Termo adicionado com sucesso.', id: newTerm.id });
    } catch (error) {
      console.error("Erro ao adicionar termo:", error);
      return reply.status(500).send({ message: 'Erro ao adicionar termo.' });
    }
  });
}
