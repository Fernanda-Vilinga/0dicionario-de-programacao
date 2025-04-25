import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../firebaseConfig";
interface SessaoMentoria {
  status: 'pendente' | 'em_curso' | 'finalizada'; // ajusta conforme teus valores possíveis
  createdAt: FirebaseFirestore.Timestamp;
  usuarioId: string;
  mentorId: string;
  // outros campos que a sessão possa ter
}
// Função auxiliar para registrar atividade (fire-and-forget)
export function registrarAtividade(userId: string, descricao: string, acao: string) {
  db.collection('atividades').add({
    userId,
    description: descricao,
    action: acao,
    createdAt: new Date(),
  }).catch(error => {
    console.error('Erro ao registrar atividade:', error);
  });
}

// Interface para o corpo da requisição de verificação de mentoria
interface VerificarMentoriaBody {
  usuarioId: string;
  mentorId: string;
}

async function chatRoutes(app: FastifyInstance) {
  // Rota para enviar mensagem no chat (disponível apenas se a sessão estiver em curso)
  app.post('/chat/enviar', async (req, reply) => {
    try {
      const body = req.body as { sessaoId?: string; remetenteId?: string; mensagem?: string };

      if (!body?.sessaoId || !body?.remetenteId || !body?.mensagem) {
        return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
      }

      // Verifica se a sessão existe
      const sessaoRef = db.collection('sessaoMentoria').doc(body.sessaoId);
      const sessao = await sessaoRef.get();
      if (!sessao.exists) {
        return reply.status(403).send({ message: 'Sessão de mentoria não encontrada.' });
      }
      
      // Permite envio apenas se a sessão estiver "em_curso"
      const statusSessao = sessao.data()?.status;
      if (statusSessao !== 'em_curso') {
        return reply.status(403).send({ message: 'Envio de mensagem não permitido para sessão finalizada.' });
      }

      // Salva a mensagem no Firestore
      const chatRef = db.collection('chats').doc(body.sessaoId);
      await chatRef.collection('mensagens').add({
        remetenteId: body.remetenteId,
        mensagem: body.mensagem,
        timestamp: new Date(),
      });

      // Registra a atividade de envio de mensagem (fire-and-forget)
      registrarAtividade(
        body.remetenteId,
        `Mensagem enviada com sucesso no chat da sessão ${body.sessaoId}.`,
        'Envio de mensagem'
      );

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

      const mensagensRef = db.collection('chats')
        .doc(sessaoId)
        .collection('mensagens')
        .orderBy('timestamp', 'asc');
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

  // Rota para verificar a sessão de mentoria entre usuário e mentor
  // Retorna a sessão mais recente com status "em_curso" ou "finalizada"
  app.post('/mentoria/verificar', async (req, reply) => {
    try {
      const body = req.body as VerificarMentoriaBody;
      const { usuarioId, mentorId } = body;
  
      if (!usuarioId || !mentorId) {
        return reply.status(400).send({ message: 'usuarioId e mentorId são obrigatórios.' });
      }
  
      const snapshot = await db
        .collection('sessaoMentoria')
        .where('usuarioId', '==', usuarioId)
        .where('mentorId', '==', mentorId)
        .get();
  
      if (snapshot.empty) {
        return reply.status(404).send({ message: 'Nenhuma sessão de mentoria encontrada.' });
      }
  
      const sessoesValidas = snapshot.docs
        .map(doc => {
          const data = doc.data() as SessaoMentoria;
          return {
            id: doc.id,
            ...data,
          };
        })
        .filter(sessao => sessao.status === 'em_curso' || sessao.status === 'finalizada')
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  
      if (sessoesValidas.length === 0) {
        return reply.status(404).send({ message: 'Nenhuma sessão de mentoria ativa ou finalizada encontrada.' });
      }
  
      const sessaoMaisRecente = sessoesValidas[0];
  
      registrarAtividade(
        usuarioId,
        `Sessão de mentoria com o mentor ${mentorId} verificada com sucesso.`,
        'Verificação de mentoria'
      );
  
      return reply.send({
        sessaoId: sessaoMaisRecente.id,
        ...sessaoMaisRecente,
      });
    } catch (error) {
      console.error("Erro ao verificar mentoria:", error);
      return reply.status(500).send({ message: 'Erro ao verificar mentoria.' });
    }
  });

  // Rota para enviar áudio como mensagem no chat (somente se a sessão estiver em curso)
  app.post('/chat/enviar-audio', async (req, reply) => {
    try {
      const body = req.body as { sessaoId?: string; remetenteId?: string; mensagem?: string };
      if (!body?.sessaoId || !body?.remetenteId || !body?.mensagem) {
        return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
      }

      // Verifica se a sessão existe
      const sessaoRef = db.collection('sessaoMentoria').doc(body.sessaoId);
      const sessao = await sessaoRef.get();
      if (!sessao.exists) {
        return reply.status(403).send({ message: 'Sessão de mentoria não encontrada.' });
      }

      // Permite envio de áudio apenas se a sessão estiver "em_curso"
      const statusSessao = sessao.data()?.status;
      if (statusSessao !== 'em_curso') {
        return reply.status(403).send({ message: 'Envio de áudio não permitido para sessão finalizada.' });
      }

      // Salva a mensagem de áudio no Firestore, marcando o tipo como "audio"
      const chatRef = db.collection('chats').doc(body.sessaoId);
      await chatRef.collection('mensagens').add({
        remetenteId: body.remetenteId,
        mensagem: body.mensagem, // URI (ou URL) do áudio
        tipo: 'audio',
        timestamp: new Date(),
      });

      // Registra a atividade de envio de áudio (fire-and-forget)
      registrarAtividade(
        body.remetenteId,
        `Áudio enviado com sucesso no chat da sessão ${body.sessaoId}.`,
        'Envio de áudio'
      );

      return reply.send({ message: 'Áudio enviado com sucesso.' });
    } catch (error) {
      console.error("Erro ao enviar áudio:", error);
      return reply.status(500).send({ message: 'Erro ao enviar áudio.' });
    }
  });
}

export default chatRoutes;
