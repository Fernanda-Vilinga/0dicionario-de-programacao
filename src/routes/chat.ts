import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../firebaseConfig";

// Interface para o corpo da requisição de verificação de mentoria
interface VerificarMentoriaBody {
  usuarioId: string;
  mentorId: string;
}

async function chatRoutes(app: FastifyInstance) {
  // Rota para enviar mensagem no chat
  app.post('/chat/enviar', async (req, reply) => {
    try {
      const body = req.body as { sessaoId?: string; remetenteId?: string; mensagem?: string };

      if (!body?.sessaoId || !body?.remetenteId || !body?.mensagem) {
        return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
      }

      // Verifica se a sessão existe e foi aceita
      const sessaoRef = db.collection('sessaoMentoria').doc(body.sessaoId);
      const sessao = await sessaoRef.get();

      if (!sessao.exists || sessao.data()?.status !== 'aceita') {
        return reply.status(403).send({ message: 'Sessão de mentoria não ativa.' });
      }

      // Salvar mensagem no Firestore
      const chatRef = db.collection('chats').doc(body.sessaoId);
      await chatRef.collection('mensagens').add({
        remetenteId: body.remetenteId,
        mensagem: body.mensagem,
        timestamp: new Date(),
      });

      return reply.send({ message: 'Mensagem enviada com sucesso.' });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return reply.status(500).send({ message: 'Erro ao enviar mensagem.' });
    }
  });

  // Rota para listar mensagens da sessão de mentoria
  app.get('/chat/mensagens/:sessaoId', async (req, reply) => {
    try {
      const { sessaoId } = req.params as { sessaoId?: string };

      if (!sessaoId) {
        return reply.status(400).send({ message: 'Sessão inválida.' });
      }

      const mensagensRef = db.collection('chats').doc(sessaoId).collection('mensagens').orderBy('timestamp', 'asc');
      const mensagensSnapshot = await mensagensRef.get();

      const mensagens = mensagensSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return reply.send(mensagens);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      return reply.status(500).send({ message: 'Erro ao buscar mensagens.' });
    }
  });

  // Nova rota para verificar a sessão de mentoria ativa entre um usuário e um mentor
  app.post('/mentoria/verificar', async (req, reply) => {
    try {
      const body = req.body as VerificarMentoriaBody;
      const { usuarioId, mentorId } = body;

      if (!usuarioId || !mentorId) {
        return reply.status(400).send({ message: 'usuarioId e mentorId são obrigatórios.' });
      }

      // Consulta a coleção "sessaoMentoria" para encontrar uma sessão com status "aceita"
      const snapshot = await db
        .collection('sessaoMentoria')
        .where('usuarioId', '==', usuarioId)
        .where('mentorId', '==', mentorId)
        .where('status', '==', 'aceita')
        .get();

      if (snapshot.empty) {
        return reply
          .status(404)
          .send({ message: 'Nenhuma sessão de mentoria ativa encontrada.' });
      }

      // Supondo que apenas uma sessão ativa exista para essa combinação
      const sessaoDoc = snapshot.docs[0];

      return reply.send({
        sessaoId: sessaoDoc.id,
        ...sessaoDoc.data(),
      });
    } catch (error) {
      console.error("Erro ao verificar mentoria:", error);
      return reply.status(500).send({ message: 'Erro ao verificar mentoria.' });
    }
  });
}

export default chatRoutes;
