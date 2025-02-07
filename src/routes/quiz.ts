import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

// Tipagem para o corpo da requisição POST
interface RespostaQuiz {
  idPergunta: string;
  respostaDada: string;
  correta: boolean;
}

interface ResponderQuizBody {
  usuarioId: string;
  respostas: RespostaQuiz[];
}

export default async function quizRoutes(app: FastifyInstance) {
  // Rota para responder quiz
  app.post('/quiz/responder', async (req: FastifyRequest<{ Body: ResponderQuizBody }>, reply: FastifyReply) => {
    const { usuarioId, respostas } = req.body;

    if (!usuarioId || !respostas || !Array.isArray(respostas)) {
      return reply.status(400).send({ message: 'Dados incompletos ou inválidos.' });
    }

    try {
      let score = 0;
      // Verificar respostas e calcular pontuação
      for (let resposta of respostas) {
        if (resposta.correta) {
          score++;
        }
      }

      // Salvar pontuação do usuário
      await db.collection('pontuacoes').add({
        usuarioId,
        score,
        data: new Date(),
      });

      return reply.send({ message: 'Quiz respondido com sucesso.', score });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao responder quiz.' });
    }
  });
}
