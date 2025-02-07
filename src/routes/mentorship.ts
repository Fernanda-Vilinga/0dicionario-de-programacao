import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

// Tipagem para o corpo da requisição POST
interface AgendarMentoriaBody {
  usuarioId: string;
  mentorId: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
}

export default async function mentoriaRoutes(app: FastifyInstance) {
  // Rota para agendar mentoria
  app.post('/mentoria/agendar', async (req: FastifyRequest<{ Body: AgendarMentoriaBody }>, reply: FastifyReply) => {
    const { usuarioId, mentorId, data, horario } = req.body;

    if (!usuarioId || !mentorId || !data || !horario) {
      return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
    }

    try {
      const dataHoraMentoria = new Date(`${data}T${horario}:00Z`);
      const agora = new Date();

      if (dataHoraMentoria <= agora) {
        return reply.status(400).send({ message: 'A mentoria deve ser agendada para uma data futura.' });
      }

      const mentoriasExistentes = await db
        .collection('sessaoMentoria')
        .where('mentorId', '==', mentorId)
        .where('data', '==', data)
        .where('horario', '==', horario)
        .get();

      if (!mentoriasExistentes.empty) {
        return reply.status(400).send({ message: 'O mentor já tem uma sessão agendada nesse horário.' });
      }

      const newSession = await db.collection('sessaoMentoria').add({
        usuarioId,
        mentorId,
        data,
        horario,
        status: 'agendado', // Status inicial
        dataCriacao: new Date(),
      });

      return reply.status(201).send({ message: 'Mentoria agendada com sucesso.', id: newSession.id });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao agendar mentoria.' });
    }
  });

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
}
