import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

// Tipagem para o corpo da requisição POST, agora incluindo mentorId e opcionalmente usuarioId
interface AgendarMentoriaBody {
  usuarioId?: string;  // opcional, caso não venha via token
  mentorId: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  planoMentoria: string;
  categoria: string;
}

export default async function mentoriaRoutes(app: FastifyInstance) {
  // Rota para agendar mentoria
  app.post(
    '/mentoria/agendar',
    async (
      req: FastifyRequest<{ Body: AgendarMentoriaBody }>,
      reply: FastifyReply
    ) => {
      // Utiliza o ID do usuário autenticado ou, se ausente, o enviado no corpo da requisição
      const usuarioId = (req as any).user?.id || req.body.usuarioId;
      const { mentorId, data, horario, planoMentoria, categoria } = req.body;

      if (!usuarioId || !mentorId || !data || !horario || !planoMentoria || !categoria) {
        return reply
          .status(400)
          .send({ message: 'Preencha todos os campos obrigatórios.' });
      }

      try {
        const dataHoraMentoria = new Date(`${data}T${horario}:00Z`);
        const agora = new Date();

        if (dataHoraMentoria <= agora) {
          return reply
            .status(400)
            .send({ message: 'A mentoria deve ser agendada para uma data futura.' });
        }

        const newSession = await db.collection('sessaoMentoria').add({
          usuarioId,
          mentorId,
          data,
          horario,
          planoMentoria,
          categoria,
          status: 'pendente', // Status inicial
          dataCriacao: new Date(),
        });

        return reply
          .status(201)
          .send({ message: 'Mentoria solicitada com sucesso.', id: newSession.id });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro ao solicitar mentoria.' });
      }
    }
  );

  // Rota para aceitar uma mentoria (mentor)
  app.patch('/mentoria/aceitar/:sessaoId', async (req, reply) => {
    const { sessaoId } = req.params as { sessaoId: string };

    try {
      const sessaoRef = db.collection('sessaoMentoria').doc(sessaoId);
      const sessao = await sessaoRef.get();

      if (!sessao.exists) {
        return reply.status(404).send({ message: 'Sessão de mentoria não encontrada.' });
      }

      await sessaoRef.update({ status: 'aceita' });

      return reply.send({ message: 'Mentoria aceita com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao aceitar mentoria.' });
    }
  });
  //rota para buscar mentorias aceites ou pendentes
  app.get(
    '/mentoria/sessoes',
    async (
      req: FastifyRequest<{ Querystring: { mentorId: string; status: string } }>,
      reply: FastifyReply
    ) => {
      const { mentorId, status } = req.query;
  
      if (!mentorId || !status) {
        return reply
          .status(400)
          .send({ message: 'Informe mentorId e status para filtrar as sessões.' });
      }
  
      try {
        const snapshot = await db
          .collection('sessaoMentoria')
          .where('mentorId', '==', mentorId)
          .where('status', '==', status)
          .get();
  
        const sessions = snapshot.docs.map(doc => ({
          sessaoId: doc.id,
          ...doc.data(),
        }));
  
        return reply.send(sessions);
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro ao buscar sessões.' });
      }
    }
  );
  
}
