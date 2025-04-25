import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FieldValue } from 'firebase-admin/firestore';
import db from '../firebaseConfig';

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

// Função auxiliar para registrar atividade (fire-and-forget)
export function registrarAtividade(userId: string, descricao: string, acao: string) {
  db.collection('atividades')
    .add({
      userId,
      description: descricao,
      action: acao,
      createdAt: new Date(), // Usamos a data atual
    })
    .catch(error => {
      console.error('Erro ao registrar atividade:', error);
    });
}

function criarDataHoraLocal(data: string, horario: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  const [hora, minuto] = horario.split(':').map(Number);
  return new Date(ano, mes - 1, dia, hora, minuto);
}

/**
 * Converte um timestamp do Firestore para objeto Date.
 * Se o valor já for Date ou string, tenta converter diretamente.
 */
function converterTimestampParaDate(timestamp: any): Date {
  if (timestamp && timestamp._seconds != null) {
    return new Date(timestamp._seconds * 1000);
  } else {
    return new Date(timestamp);
  }
}

/**
 * Verifica e atualiza o status de uma sessão.
 * - Se o status for "pendente" e já passou do início → "expirada".
 * - Se o status for "aceita" e o horário atual está entre o início e o fim:
 *     → Verifica se já não existe outra sessão "em_curso" para este mentor.
 *       Se não houver, atualiza para "em_curso". Caso haja, atualiza para "cancelada".
 * - Se o status for "aceita" ou "em_curso" e já passou do fim → "finalizada".
 */
async function verificarEAtualizarSessao(docId: string, sessaoData: any): Promise<string> {
  const agora = new Date();
  const inicio = converterTimestampParaDate(sessaoData.dataHoraInicio);
  const fim = converterTimestampParaDate(sessaoData.dataHoraFim);

  let novoStatus = sessaoData.status;

  if (sessaoData.status === 'pendente' && agora > inicio) {
    novoStatus = 'expirada';
  } else if (sessaoData.status === 'aceita' && agora >= inicio && agora < fim) {
    // Verifica se já existe uma sessão em curso para este mentor neste horário
    const snapshot = await db.collection('sessaoMentoria')
      .where('mentorId', '==', sessaoData.mentorId)
      .where('status', '==', 'em_curso')
      .where('dataHoraFim', '>', inicio)
      .get();
    
    if (snapshot.empty) {
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

  // Rota para agendar sessão
  app.post('/mentoria/agendar', async (req: FastifyRequest<{ Body: AgendarMentoriaBody }>, reply: FastifyReply) => {
    const usuarioId = (req as any).user?.id || req.body.usuarioId;
    const { mentorId, data, horario, categoria } = req.body;

    if (!usuarioId || !mentorId || !data || !horario || !categoria) {
      return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
    }

    try {
      const dataHoraInicio = criarDataHoraLocal(data, horario);
      const dataHoraFim = new Date(dataHoraInicio.getTime() + 30 * 60000);
      const agora = new Date();

      if (dataHoraInicio <= agora) {
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

      // Registra atividade de agendamento (fire-and-forget)
      const descricao = `Agendou uma sessão de mentoria para ${data} às ${horario}.`;
      const acao = "Agendar Mentoria";
      registrarAtividade(usuarioId, descricao, acao);

      return reply.status(201).send({ message: 'Mentoria solicitada com sucesso.', id: newSession.id });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao solicitar mentoria.' });
    }
  });

  // Rota para atualizar sessões vencidas / em curso / finalizadas
  app.patch('/mentoria/expirar-sessoes', async (req, reply) => {
    try {
      const snapshot = await db.collection('sessaoMentoria')
        .where('status', 'in', ['pendente', 'aceita', 'em_curso'])
        .get();

      let atualizadas = 0;
      for (const doc of snapshot.docs) {
        const sessao = doc.data();
        if (!sessao?.dataHoraInicio) continue;
        const novoStatus = await verificarEAtualizarSessao(doc.id, sessao);
        if (novoStatus !== sessao.status) atualizadas++;
      }

      return reply.send({ message: `${atualizadas} sessões atualizadas com novo status.` });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao atualizar sessões vencidas.' });
    }
  });

  // Rota para aceitar sessão
  app.patch('/mentoria/:id/aceitar', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await db.collection('sessaoMentoria').doc(id).update({ status: 'aceita' });
      
      // Registra atividade de aceitação (fire-and-forget)
      const userId = (req as any).user?.id || 'sistema';
      const descricao = `Sessão de mentoria aceita com sucesso.`;
      const acao = "Aceitar Mentoria";
      registrarAtividade(userId, descricao, acao);

      return reply.send({ message: 'Mentoria aceita com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao aceitar mentoria.' });
    }
  });

  // Rota para rejeitar sessão
  app.patch('/mentoria/:id/rejeitar', async (req: FastifyRequest<{ Body: RejeitarMentoriaBody }>, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { motivo } = req.body;
    try {
      await db.collection('sessaoMentoria').doc(id).update({ status: 'rejeitada', motivoRejeicao: motivo });

      // Registra atividade de rejeição (fire-and-forget)
      const userId = (req as any).user?.id || 'sistema';
      const descricao = `Sessão de mentoria rejeitada. Motivo: ${motivo || 'não informado'}.`;
      const acao = "Rejeitar Mentoria";
      registrarAtividade(userId, descricao, acao);

      return reply.send({ message: 'Mentoria rejeitada com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao rejeitar mentoria.' });
    }
  });

  // Rota para cancelar sessão
  app.patch('/mentoria/:id/cancelar', async (req: FastifyRequest<{ Body: CancelarMentoriaBody }>, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { motivo } = req.body;
    try {
      await db.collection('sessaoMentoria').doc(id).update({ status: 'cancelada', motivoCancelamento: motivo });

      // Registra atividade de cancelamento (fire-and-forget)
      const userId = (req as any).user?.id || 'sistema';
      const descricao = `Sessão de mentoria cancelada. Motivo: ${motivo || 'não informado'}.`;
      const acao = "Cancelar Mentoria";
      registrarAtividade(userId, descricao, acao);

      return reply.send({ message: 'Mentoria cancelada com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao cancelar mentoria.' });
    }
  });

  // Rota para buscar todas as mentorias (lista completa com atualização automática)
  app.get('/mentoria', async (req, reply) => {
    try {
      const snapshot = await db.collection('sessaoMentoria').get();
      const mentorias = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const novoStatus = await verificarEAtualizarSessao(doc.id, data);
        return { id: doc.id, ...data, status: novoStatus };
      }));
      return reply.send(mentorias);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar mentorias.' });
    }
  });

  // Rota para buscar uma mentoria específica (com atualização automática)
  app.get('/mentoria/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const doc = await db.collection('sessaoMentoria').doc(id).get();
      if (!doc.exists) {
        return reply.status(404).send({ message: 'Mentoria não encontrada.' });
      }
      const data = doc.data();
      const novoStatus = await verificarEAtualizarSessao(doc.id, data);
      return reply.send({ id: doc.id, ...data, status: novoStatus });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar mentoria.' });
    }
  });

  // Rota para busca filtrada de sessões (com atualização automática de status)
  app.get('/mentoria/sessoes', async (req, reply) => {
    const { status, mentorId, usuarioId } = req.query as {
      status?: string;
      mentorId?: string;
      usuarioId?: string;
    };

    try {
      let query: FirebaseFirestore.Query = db.collection('sessaoMentoria');
      if (status) query = query.where('status', '==', status);
      if (mentorId) query = query.where('mentorId', '==', mentorId);
      if (usuarioId) query = query.where('usuarioId', '==', usuarioId);

      const snapshot = await query.get();
      if (snapshot.empty) {
        return reply.send({ sessoes: [] });
      }

      const sessoes = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const novoStatus = await verificarEAtualizarSessao(doc.id, data);
        return { id: doc.id, ...data, status: novoStatus };
      }));

      return reply.send({ sessoes });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar sessões.' });
    }
  });

  // Rota para buscar as mentorias de um usuário específico
  app.get('/mentoria/minhas-sessoes', async (req: FastifyRequest<{ Querystring: MinhasSessoesQuery }>, reply) => {
    const usuarioId = (req as any).user?.id || req.query.usuarioId;
    if (!usuarioId) {
      return reply.status(400).send({ message: 'Usuário não informado.' });
    }
  
    try {
      const snapshot = await db.collection('sessaoMentoria')
        .where('usuarioId', '==', usuarioId)
        .get();
  
      if (snapshot.empty) {
        return reply.send({ sessoes: [] });
      }
  
      const sessoes = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const novoStatus = await verificarEAtualizarSessao(doc.id, data);
        return { id: doc.id, ...data, status: novoStatus };
      }));
  
      return reply.send({ sessoes });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao buscar as mentorias do usuário.' });
    }
  });
  
  // Rota para avaliar sessão
  app.post('/mentoria/:id/avaliar', async (req: FastifyRequest<{ Body: AvaliarMentoriaBody }>, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { nota, comentario, avaliadorId } = req.body;
    if (nota < 1 || nota > 5) {
      return reply.status(400).send({ message: 'A nota deve estar entre 1 e 5.' });
    }
    try {
      // Atualiza a sessão com a avaliação
      await db.collection('sessaoMentoria').doc(id).update({
        avaliacao: {
          nota,
          comentario: comentario || '',
          avaliadorId,
          data: new Date(),
        },
      });

      // Registra atividade de avaliação (fire-and-forget)
      const descricao = `Sessão de mentoria avaliada com nota ${nota}.`;
      const acao = "Avaliar Mentoria";
      registrarAtividade(avaliadorId, descricao, acao);

      return reply.send({ message: 'Avaliação registrada com sucesso.' });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao registrar avaliação.' });
    }
  });
}
