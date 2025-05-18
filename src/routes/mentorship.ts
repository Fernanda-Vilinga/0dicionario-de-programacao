import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import db from '../firebaseConfig';
import { registrarAtividade, dispararEvento } from './notificationsservice';

interface AgendarMentoriaBody {
  usuarioId?: string;
  mentorId: string;
  data: string; // "YYYY-MM-DD"
  horario: string; // "HH:mm"
  categoria: string;
}
interface MinhasSessoesQuery {
  usuarioId?: string;
}

interface RejeitarMentoriaBody {
  motivo?: string;
}

interface CancelarMentoriaBody {
  motivo?: string;
}
interface AvaliarMentoriaBody {
  nota: number;           // Número, por exemplo, de 1 a 5
  comentario?: string;    // Opcional
  avaliadorId: string;
}

// Helper to parse timestamp
function converterTimestampParaDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate();
  return new Date(val);
}

function criarDataHoraLocal(data: string, horario: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  const [hora, minuto] = horario.split(':').map(Number);
  return new Date(ano, mes - 1, dia, hora, minuto);
}

async function verificarEAtualizarSessao(docId: string, sessaoData: any): Promise<string> {
  const agora = new Date();
  const inicio = converterTimestampParaDate(sessaoData.dataHoraInicio);
  const fim = converterTimestampParaDate(sessaoData.dataHoraFim);
  let novoStatus = sessaoData.status;

  if (sessaoData.status === 'pendente' && agora > inicio) {
    novoStatus = 'expirada';
  } else if (sessaoData.status === 'aceita' && agora >= inicio && agora < fim) {
    const snap = await db.collection('sessaoMentoria')
      .where('mentorId', '==', sessaoData.mentorId)
      .where('status', '==', 'em_curso')
      .where('dataHoraFim', '>', inicio)
      .get();
    if (snap.empty) {
      novoStatus = 'em_curso';
    } else {
      novoStatus = 'cancelada';
      await db.collection('sessaoMentoria').doc(docId).update({
        status: 'cancelada',
        motivoCancelamento: 'Choque de horário com outra sessão.'
      });
    }
  } else if ((sessaoData.status === 'aceita' || sessaoData.status === 'em_curso') && agora >= fim) {
    novoStatus = 'finalizada';
  }

  if (novoStatus !== sessaoData.status) {
    await db.collection('sessaoMentoria').doc(docId).update({ status: novoStatus });
  }
  return novoStatus;
}

export default async function mentoriaRoutes(app: FastifyInstance) {
  // Agendar sessão
  app.post('/mentoria/agendar', async (req: FastifyRequest<{ Body: AgendarMentoriaBody }>, reply: FastifyReply) => {
    const usuarioId = (req as any).user?.id || req.body.usuarioId;
    const { mentorId, data, horario, categoria } = req.body;
    if (!usuarioId || !mentorId || !data || !horario || !categoria) {
      return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
    }

    try {
      const dataHoraInicio = criarDataHoraLocal(data, horario);
      const dataHoraFim = new Date(dataHoraInicio.getTime() + 30 * 60000);
      if (dataHoraInicio <= new Date()) {
        return reply.status(400).send({ message: 'A mentoria deve ser agendada para uma data futura.' });
      }
      const newSession = await db.collection('sessaoMentoria').add({
        usuarioId,
        mentorId,
        data,
        horario,
        categoria,
        status: 'pendente',
        dataCriacao: new Date(),
        dataHoraInicio,
        dataHoraFim
      });

      const descricao = `Agendou uma sessão de mentoria para ${data} às ${horario}.`;
      registrarAtividade(usuarioId, descricao, 'mentoria.agendar');
      // Notificação
      await dispararEvento('mentoria.agendar', usuarioId, { usuarioNome: usuarioId, data, horario });

      return reply.status(201).send({ message: 'Mentoria solicitada com sucesso.', id: newSession.id });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao solicitar mentoria.' });
    }
  });

  // Expirar sessões
  app.patch('/mentoria/expirar-sessoes', async (req, reply) => {
    try {
      const snapshot = await db.collection('sessaoMentoria')
        .where('status', 'in', ['pendente', 'aceita', 'em_curso'])
        .get();
      let atualizadas = 0;
      for (const doc of snapshot.docs) {
        const novo = await verificarEAtualizarSessao(doc.id, doc.data());
        if (novo !== doc.data().status) atualizadas++;
      }
      return reply.send({ message: `${atualizadas} sessões atualizadas.` });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao atualizar sessões.' });
    }
  });

  // Aceitar sessão
  app.patch('/mentoria/:id/aceitar', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await db.collection('sessaoMentoria').doc(id).update({ status: 'aceita' });
      const userId = (req as any).user?.id || 'sistema';
      registrarAtividade(userId, 'Sessão de mentoria aceita.', 'mentoria.aceitar');
      await dispararEvento('mentoria.aceitar', userId, { mentorNome: userId });
      return reply.send({ message: 'Mentoria aceita com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao aceitar mentoria.' });
    }
  });

  // Rejeitar sessão
  app.patch('/mentoria/:id/rejeitar', async (req: FastifyRequest<{ Body: RejeitarMentoriaBody }>, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { motivo } = req.body;
    try {
      await db.collection('sessaoMentoria').doc(id).update({ status: 'rejeitada', motivoRejeicao: motivo });
      const userId = (req as any).user?.id || 'sistema';
      registrarAtividade(userId, `Sessão rejeitada. Motivo: ${motivo}.`, 'mentoria.rejeitar');
      await dispararEvento('mentoria.rejeitar', userId, { mentorNome: userId, motivo });
      return reply.send({ message: 'Mentoria rejeitada com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao rejeitar mentoria.' });
    }
  });

  // Cancelar sessão
  app.patch('/mentoria/:id/cancelar', async (req: FastifyRequest<{ Body: CancelarMentoriaBody }>, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { motivo } = req.body;
    try {
      await db.collection('sessaoMentoria').doc(id).update({ status: 'cancelada', motivoCancelamento: motivo });
      const userId = (req as any).user?.id || 'sistema';
      registrarAtividade(userId, `Sessão cancelada. Motivo: ${motivo}.`, 'mentoria.cancelar');
      await dispararEvento('mentoria.cancelar', userId, { usuarioNome: userId, motivo });
      return reply.send({ message: 'Mentoria cancelada com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao cancelar mentoria.' });
    }
  });

  // Listar todas as mentorias
  app.get('/mentoria', async (req, reply) => {
    try {
      const snapshot = await db.collection('sessaoMentoria').get();
      const mentorias = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        const status = await verificarEAtualizarSessao(doc.id, data);
        return { sessaoId: doc.id, ...data, status };
      }));
      return reply.send(mentorias);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar mentorias.' });
    }
  });

  // Listar por filtro
  app.get('/mentoria/sessoes', async (req, reply) => {
    const { status, mentorId, usuarioId } = req.query as any;
    try {
      let query: any = db.collection('sessaoMentoria');
      if (status) query = query.where('status', '==', status);
      if (mentorId) query = query.where('mentorId', '==', mentorId);
      if (usuarioId) query = query.where('usuarioId', '==', usuarioId);
      const snapshot = await query.get();
      const sessoes = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const newStatus = await verificarEAtualizarSessao(doc.id, data);
        sessoes.push({ sessaoId: doc.id, ...data, status: newStatus });
      }
      return reply.send({ sessoes });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar sessões.' });
    }
  });

  // Minhas sessões
  app.get('/mentoria/minhas-sessoes', async (req: FastifyRequest<{ Querystring: MinhasSessoesQuery }>, reply) => {
    const usuarioId = (req as any).user?.id || req.query.usuarioId;
    if (!usuarioId) return reply.status(400).send({ message: 'Usuário não informado.' });
    try {
      const snapshot = await db.collection('sessaoMentoria').where('usuarioId', '==', usuarioId).get();
      const sessoes = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const newStatus = await verificarEAtualizarSessao(doc.id, data);
        sessoes.push({ sessaoId: doc.id, ...data, status: newStatus });
      }
      return reply.send({ sessoes });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar sessões do usuário.' });
    }
  });

  // Avaliar sessão
  app.post('/mentoria/:id/avaliar', async (req: FastifyRequest<{ Body: AvaliarMentoriaBody }>, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { nota, comentario, avaliadorId } = req.body;
    if (nota < 1 || nota > 5) return reply.status(400).send({ message: 'A nota deve estar entre 1 e 5.' });
    try {
      await db.collection('sessaoMentoria').doc(id).update({
        avaliacao: { nota, comentario: comentario || '', avaliadorId, data: new Date() }
      });
      const descricao = `Sessão de mentoria avaliada com nota ${nota}.`;
      registrarAtividade(avaliadorId, descricao, 'mentoria.finalizar');
      await dispararEvento('mentoria.finalizar', avaliadorId, { mentorNome: avaliadorId });
      return reply.send({ message: 'Avaliação registrada com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao registrar avaliação.' });
    }
  });
}
