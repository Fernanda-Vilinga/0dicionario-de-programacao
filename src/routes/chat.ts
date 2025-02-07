import { FastifyInstance } from "fastify";
import db from "../firebaseConfig";

async function chatRoutes(app: FastifyInstance) {
  // Rota para enviar mensagem no chat
  app.post('/chat/enviar', async (req, reply) => {
    const { sessaoId, remetenteId, mensagem } = req.body as {
      sessaoId: string;
      remetenteId: string;
      mensagem: string;
    };

    if (!sessaoId || !remetenteId || !mensagem) {
      return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
      // Verifica se a sessão existe e foi aceita
      const sessaoRef = db.collection('sessaoMentoria').doc(sessaoId);
      const sessao = await sessaoRef.get();

      if (!sessao.exists || sessao.data()?.status !== 'aceita') {
        return reply.status(403).send({ message: 'Sessão de mentoria não ativa.' });
      }

      // Salvar mensagem no Firestore
      const chatRef = db.collection('chats').doc(sessaoId);
      await chatRef.collection('mensagens').add({
        remetenteId,
        mensagem,
        timestamp: new Date(),
      });

      return reply.send({ message: 'Mensagem enviada com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao enviar mensagem.' });
    }
  });

  // Rota para listar mensagens da sessão de mentoria
  app.get('/chat/mensagens/:sessaoId', async (req, reply) => {
    const { sessaoId } = req.params as { sessaoId: string };

    try {
      const mensagensRef = db.collection('chats').doc(sessaoId).collection('mensagens').orderBy('timestamp', 'asc');
      const mensagensSnapshot = await mensagensRef.get();

      const mensagens = mensagensSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return reply.send(mensagens);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar mensagens.' });
    }
  });
}

export default chatRoutes;
