import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

// ---------------------
// Tipos para o quiz
// ---------------------

// Cada resposta enviada ao responder o quiz
interface RespostaQuiz {
  idPergunta: string;
  respostaDada: string;
  correta: boolean;
}

// Corpo da requisição para responder um quiz
interface ResponderQuizBody {
  usuarioId: string;
  respostas: RespostaQuiz[];
}

// Modelo de uma pergunta de quiz (para gerenciamento do admin)
interface QuizQuestion {
  categoria: string;
  pergunta: string;
  opcoes: string[];
  respostaCorreta: number; // índice da opção correta
}

// ---------------------
// Rotas do Quiz
// ---------------------

export default async function quizRoutes(app: FastifyInstance) {
  // Rota para responder o quiz (usuário responde e pontuação é calculada)
  app.post('/quiz/responder', async (req: FastifyRequest<{ Body: ResponderQuizBody }>, reply: FastifyReply) => {
    const { usuarioId, respostas } = req.body;

    if (!usuarioId || !respostas || !Array.isArray(respostas)) {
      return reply.status(400).send({ message: 'Dados incompletos ou inválidos.' });
    }

    try {
      let score = 0;
      // Calcula a pontuação com base nas respostas corretas
      for (let resposta of respostas) {
        if (resposta.correta) {
          score++;
        }
      }

      // Salva a pontuação do usuário no Firestore
      await db.collection('pontuacoes').add({
        usuarioId,
        score,
        data: new Date(),
      });

      return reply.send({ message: 'Quiz respondido com sucesso.', score });
    } catch (error) {
      console.error("Erro ao responder quiz:", error);
      return reply.status(500).send({ message: 'Erro ao responder quiz.' });
    }
  });

  // ---------------------
  // Rotas para gerenciamento de perguntas do quiz (para o admin)
  // ---------------------

  // Criar uma nova pergunta de quiz
  app.post('/quiz/perguntas', async (req: FastifyRequest<{ Body: QuizQuestion }>, reply: FastifyReply) => {
    const { categoria, pergunta, opcoes, respostaCorreta } = req.body;
    if (!categoria || !pergunta || !opcoes || opcoes.length === 0 || respostaCorreta === undefined) {
      return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
    }
    try {
      const newQuestion = await db.collection('quizPerguntas').add({
        categoria,
        pergunta,
        opcoes,
        respostaCorreta,
        dataCriacao: new Date(),
      });
      return reply.status(201).send({ message: 'Pergunta criada com sucesso.', id: newQuestion.id });
    } catch (error) {
      console.error("Erro ao criar pergunta:", error);
      return reply.status(500).send({ message: 'Erro ao criar pergunta.' });
    }
  });

  // Listar perguntas de quiz (opcionalmente filtradas por categoria)
  app.get('/quiz/perguntas', async (req: FastifyRequest<{ Querystring: { categoria?: string } }>, reply: FastifyReply) => {
    const { categoria } = req.query;
    try {
      // Declaramos a variável como Query
      let query: FirebaseFirestore.Query = db.collection('quizPerguntas');
      // Se a categoria estiver definida, aplicamos o filtro
      if (categoria) {
        query = query.where("categoria", "==", categoria);
      }
      const snapshot = await query.get();
      if (snapshot.empty) {
        return reply.send([]);
      }
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return reply.send(questions);
    } catch (error) {
      console.error("Erro ao listar perguntas:", error);
      return reply.status(500).send({ message: 'Erro ao listar perguntas.' });
    }
  });
  
  // Atualizar uma pergunta de quiz
  app.put('/quiz/perguntas/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: Partial<QuizQuestion> }>, reply: FastifyReply) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const questionRef = db.collection('quizPerguntas').doc(id);
      const doc = await questionRef.get();
      if (!doc.exists) {
        return reply.status(404).send({ message: 'Pergunta não encontrada.' });
      }
      await questionRef.update({
        ...updates,
      });
      return reply.send({ message: 'Pergunta atualizada com sucesso.' });
    } catch (error) {
      console.error("Erro ao atualizar pergunta:", error);
      return reply.status(500).send({ message: 'Erro ao atualizar pergunta.' });
    }
  });



  // Deletar uma pergunta de quiz
  app.delete('/quiz/perguntas/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return reply.status(400).send({ message: "ID da pergunta é obrigatório." });
      }
  
      const questionRef = db.collection('quizPerguntas').doc(id);
      const doc = await questionRef.get();
  
      if (!doc.exists) {
        return reply.status(404).send({ message: 'Pergunta não encontrada.' });
      }
  
      await questionRef.delete();
      return reply.send({ message: 'Pergunta deletada com sucesso.' });
    } catch (error) {
      console.error("Erro ao deletar pergunta:", error);
      return reply.status(500).send({ message: 'Erro interno ao deletar pergunta.' });
    }
  });
  
  
  
}
