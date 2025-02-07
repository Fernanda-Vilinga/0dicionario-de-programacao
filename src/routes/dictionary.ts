import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

// Tipagem para o corpo da requisição POST
interface TermoBody {
  termo: string;
  definicao: string;
  exemplos?: string[];
  linguagem?: string;
}

// Tipagem para os parâmetros de consulta (query)
interface TermoQuery {
  termo: string;
}

export default async function dicionarioRoutes(app: FastifyInstance) {
  // Rota para pesquisar termos
  app.get('/dicionario/termos', async (req: FastifyRequest<{ Querystring: TermoQuery }>, reply: FastifyReply) => {
    const { termo } = req.query;

    if (!termo) {
      return reply.status(400).send({ message: 'Termo não fornecido.' });
    }

    try {
      const termRef = db.collection('termos').where('termo', '>=', termo).where('termo', '<=', termo + '\uf8ff');
      const termSnapshot = await termRef.get();
      
      if (termSnapshot.empty) {
        return reply.status(404).send({ message: 'Termo não encontrado.' });
      }

      const termos = termSnapshot.docs.map(doc => doc.data());
      return reply.send(termos);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar termo' });
    }
  });

  // Rota para o Admin adicionar um termo
  app.post('/dicionario/termo', async (req: FastifyRequest<{ Body: TermoBody }>, reply: FastifyReply) => {
    const { termo, definicao, exemplos, linguagem } = req.body;

    if (!termo || !definicao) {
      return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
    }

    try {
      const newTerm = await db.collection('termos').add({
        termo,
        definicao,
        exemplos,
        linguagem,
      });

      return reply.status(201).send({ message: 'Termo adicionado com sucesso.', id: newTerm.id });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao adicionar termo.' });
    }
  });
}
