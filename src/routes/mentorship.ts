import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import db from '../firebaseConfig';

// Tipagem para o corpo da requisição POST de agendamento de mentoria
interface AgendarMentoriaBody {
  usuarioId?: string;  // opcional, caso não venha via token
  mentorId: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  planoMentoria?: string;
  categoria: string;
}

// Tipagem para rejeição de mentoria (opcional incluir motivo)
interface RejeitarMentoriaBody {
  motivo?: string;
}

// Tipagem para cancelamento de mentoria
interface CancelarMentoriaBody {
  motivo?: string;
}

export default async function mentoriaRoutes(app: FastifyInstance) {
  // Rota para agendar mentoria - Acesso para Mentorandos
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
        // Calcula a data/hora de início e término (duração de 30 minutos)
        const dataHoraInicio = new Date(`${data}T${horario}:00Z`);
        const dataHoraFim = new Date(dataHoraInicio.getTime() + 30 * 60000);
        const agora = new Date();

        if (dataHoraInicio <= agora) {
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
          dataHoraInicio: dataHoraInicio, // salva data/hora de início
          dataHoraFim: dataHoraFim        // salva data/hora de término
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

  // Rota para aceitar uma mentoria (Mentor)
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

  // Rota para rejeitar uma mentoria (Mentor)
  app.patch(
    '/mentoria/rejeitar/:sessaoId',
    async (
      req: FastifyRequest<{ Params: { sessaoId: string }, Body: RejeitarMentoriaBody }>,
      reply: FastifyReply
    ) => {
      const { sessaoId } = req.params;
      const { motivo } = req.body;
  
      try {
        const sessaoRef = db.collection('sessaoMentoria').doc(sessaoId);
        const sessao = await sessaoRef.get();
  
        if (!sessao.exists) {
          return reply.status(404).send({ message: 'Sessão de mentoria não encontrada.' });
        }
  
        // Atualiza para rejeitada e armazena o motivo se fornecido
        await sessaoRef.update({ status: 'rejeitada', motivoRejeicao: motivo || '' });
  
        return reply.send({ message: 'Mentoria rejeitada com sucesso.' });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro ao rejeitar a mentoria.' });
      }
    }
  );

  // Rota para cancelar uma sessão (mentorando ou mentor cancela)
  // A regra é: a sessão pode ser cancelada se for feita com **24h de antecedência**
  app.patch(
    '/mentoria/cancelar/:sessaoId',
    async (
      req: FastifyRequest<{ Params: { sessaoId: string }, Body: CancelarMentoriaBody }>,
      reply: FastifyReply
    ) => {
      const { sessaoId } = req.params;
      const { motivo } = req.body;
  
      try {
        const sessaoRef = db.collection('sessaoMentoria').doc(sessaoId);
        const sessaoDoc = await sessaoRef.get();
  
        if (!sessaoDoc.exists) {
          return reply.status(404).send({ message: 'Sessão de mentoria não encontrada.' });
        }
  
        const sessao = sessaoDoc.data();
        if (!sessao?.dataHoraInicio) {
          return reply.status(500).send({ message: 'Horário da sessão não definido.' });
        }
  
        const dataHoraInicio = new Date(sessao.dataHoraInicio);
        const agora = new Date();
        const diffHoras = (dataHoraInicio.getTime() - agora.getTime()) / (1000 * 60 * 60);
  
        // Cancelamento permitido apenas se faltarem 24h ou mais para o início
        if (diffHoras < 24) {
          return reply
            .status(400)
            .send({ message: 'Cancelamento permitido somente 24h antes do início da sessão.' });
        }
  
        // Atualiza o status para cancelada e registra o motivo (se houver)
        await sessaoRef.update({ status: 'cancelada', motivoCancelamento: motivo || '' });
  
        return reply.send({ message: 'Sessão cancelada com sucesso.' });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro ao cancelar sessão.' });
      }
    }
  );

  // Rota para expirar sessões vencidas (Admin ou automação)
  // Atualiza o status para "expirada" se a dataHoraFim for menor que o horário atual
  app.patch('/mentoria/expirar-sessoes', async (req, reply) => {
    try {
      const agora = new Date();
  
      const snapshot = await db
        .collection('sessaoMentoria')
        .where('status', 'in', ['pendente', 'aceita'])
        .get();
  
      const sessoesExpiradas: string[] = [];
      const batch = db.batch();
  
      snapshot.forEach((doc) => {
        const sessao = doc.data();
        if (!sessao?.dataHoraFim) return;
  
        const dataHoraFim = new Date(sessao.dataHoraFim);
  
        if (agora > dataHoraFim) {
          batch.update(doc.ref, { status: 'expirada' });
          sessoesExpiradas.push(doc.id);
        }
      });
  
      if (sessoesExpiradas.length > 0) {
        await batch.commit();
      }
  
      return reply.send({
        message: `${sessoesExpiradas.length} sessões expirada(s).`,
        sessoesExpiradas,
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao expirar sessões.' });
    }
  });
  
  // Rota para buscar sessões filtradas pelo mentor (Mentor - pendentes/aceitas)
  // Rota para buscar sessões filtradas por mentor e/ou mentorando (Mentor ou Admin)
app.get(
  '/mentoria/sessoes',
  async (
    req: FastifyRequest<{ Querystring: { mentorId?: string; usuarioId?: string; status?: string } }>,
    reply: FastifyReply
  ) => {
    const { mentorId, usuarioId, status } = req.query;

    try {
      let query = db.collection('sessaoMentoria') as FirebaseFirestore.Query;

      // Adiciona os filtros dinamicamente conforme os parâmetros recebidos
      if (mentorId) query = query.where('mentorId', '==', mentorId);
      if (usuarioId) query = query.where('usuarioId', '==', usuarioId);
      if (status) query = query.where('status', '==', status);

      const snapshot = await query.get();

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

  
  // Rota para que o mentorando consulte as suas sessões (Mentorando)
  app.get(
    '/mentoria/minhas-sessoes',
    async (
      req: FastifyRequest<{ Querystring: { usuarioId?: string } }>,
      reply: FastifyReply
    ) => {
      // Usa o ID do usuário presente no token ou, se não houver, na query string
      const usuarioId = (req as any).user?.id || req.query.usuarioId;
      
      if (!usuarioId) {
        return reply
          .status(400)
          .send({ message: 'Usuário não identificado.' });
      }
  
      try {
        const snapshot = await db
          .collection('sessaoMentoria')
          .where('usuarioId', '==', usuarioId)
          .get();
  
        const sessions = snapshot.docs.map(doc => ({
          sessaoId: doc.id,
          ...doc.data(),
        }));
  
        return reply.send(sessions);
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro ao buscar suas sessões.' });
      }
    }
  );
  
  // Rota para que o admin visualize todas as sessões (Admin)
  app.get(
    '/admin/mentorias',
    async (
      req: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const snapshot = await db.collection('sessaoMentoria').get();
  
        const sessions = snapshot.docs.map(doc => ({
          sessaoId: doc.id,
          ...doc.data(),
        }));
  
        return reply.send(sessions);
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro ao buscar sessões para o admin.' });
      }
    }
  );
}
