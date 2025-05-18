import db from '../firebaseConfig';
import admin from 'firebase-admin';

/**
 * Define como cada evento de notificação deve ser tratado
 */
interface RegraNotificacao {
  evento: string;
  remetenteRole: string;
  destinatariosRoles: string[];
  template: (data: any) => string;
  agrupar?: boolean;
}

// Central de regras baseada na TABELA PRINCIPAL
const regras: RegraNotificacao[] = [
  // Perfil
  {
    evento: 'perfil.atualizar.user',
    remetenteRole: 'USER',
    destinatariosRoles: ['MENTOR', 'ADMIN'],
    template: ({ nome }: any) => `${nome} atualizou seu perfil.`,
  },
  {
    evento: 'perfil.atualizar.mentor',
    remetenteRole: 'MENTOR',
    destinatariosRoles: ['USER', 'ADMIN'],
    template: ({ nome }: any) => `${nome} atualizou seu perfil de mentor.`,
  },
  // Quiz
  {
    evento: 'quiz.criar',
    remetenteRole: 'ADMIN',
    destinatariosRoles: ['USER', 'ADMIN'],
    template: ({ titulo }: any) => `🎯 Novo quiz publicado: "${titulo}"`,
  },
  {
    evento: 'quiz.atualizar',
    remetenteRole: 'ADMIN',
    destinatariosRoles: ['USER', 'ADMIN'],
    template: ({ perguntaId }: any) => `🔄 Quiz atualizado (ID: ${perguntaId})`,
  },
  // Dicionário
  {
    evento: 'dicionario.adicionar',
    remetenteRole: 'ADMIN',
    destinatariosRoles: ['USER', 'ADMIN'],
    template: ({ termo }: any) => `✅ Novo termo adicionado: "${termo}"`,
    agrupar: true,
  },
  {
    evento: 'dicionario.atualizar',
    remetenteRole: 'ADMIN',
    destinatariosRoles: ['USER', 'ADMIN'],
    template: ({ termo }: any) => `🔄 Termo "${termo}" foi atualizado.`,
    agrupar: true,
  },
  // Sugestões
  {
    evento: 'sugestao.criar',
    remetenteRole: 'USER',
    destinatariosRoles: ['ADMIN'],
    template: ({ categoria }: any) => `💡 Nova sugestão recebida: "${categoria}"`,
  },
  {
    evento: 'sugestao.atualizar',
    remetenteRole: 'ADMIN',
    destinatariosRoles: ['USER', 'ADMIN'],
    template: ({ status }: any) => {
      if (status === 'aceita') return `✅ A Sugestão foi aceita.`;
      if (status === 'rejeitada') return `❌ A sugestão foi rejeitada.`;
      return `🔄 O pedido de sugestão está "${status}".`;
    },
  },
  // Mentoria
  {
    evento: 'mentoria.agendar',
    remetenteRole: 'USER',
    destinatariosRoles: ['MENTOR', 'ADMIN'],
    template: ({ usuarioNome, data, horario }: any) =>
      `🗓 Sua mentoria com ${usuarioNome} está agendada para ${data} às ${horario}.`,
  },
  {
    evento: 'mentoria.iniciar',
    remetenteRole: 'SISTEMA',
    destinatariosRoles: ['USER', 'MENTOR'],
    template: ({ mentorNome }: any) => `🔔 Sua mentoria com ${mentorNome} entrou em curso! Entre no chat.`,
  },
  {
    evento: 'mentoria.aceitar',
    remetenteRole: 'MENTOR',
    destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
    template: ({ mentorNome }: any) => `✅ Sua mentoria foi aceita por ${mentorNome}.`,
  },
  {
    evento: 'mentoria.rejeitar',
    remetenteRole: 'MENTOR',
    destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
    template: ({ mentorNome, motivo }: any) =>
      `❌ A sessão com ${mentorNome} foi rejeitada. Motivo: ${motivo}.`,
  },
  {
    evento: 'mentoria.cancelar',
    remetenteRole: 'USER',
    destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
    template: ({ usuarioNome, motivo }: any) =>
      `❌ A sessão com ${usuarioNome} foi cancelada. Motivo: ${motivo}.`,
  },
  {
    evento: 'mentoria.finalizar',
    remetenteRole: 'SISTEMA',
    destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
    template: ({ mentorNome }: any) =>
      `✅ Sua mentoria com ${mentorNome} foi finalizada com sucesso.`,
  },
  {
    evento: 'mentoria.expirada',
    remetenteRole: 'SISTEMA',
    destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
    template: ({ mentorNome }: any) =>
      `⏰ Sua mentoria com ${mentorNome} expirou.`,
  },
];

/**
 * Registra um log de atividade na coleção 'atividades'.
 */
export async function registrarAtividade(
  userId: string,
  description: string,
  action: string
): Promise<void> {
  const timestamp = admin.firestore.Timestamp.now();
  await db.collection('atividades').add({ userId, description, action, createdAt: timestamp });
}

/**
 * Busca lista de userIds pelo papel.
 */
export async function buscarUsuariosPorRole(role: string): Promise<string[]> {
  const tipo = role.toUpperCase();
  const snap = await db.collection('usuarios').where('tipo_de_usuario', '==', tipo).get();
  return snap.docs.map(doc => doc.id);
}

/**
 * Envia notificações em batch para múltiplos usuários.
 */
export async function distribuirNotificacao(
  recipients: string[],
  type: string,
  message: string
): Promise<void> {
  if (!recipients.length) return;
  const batch = db.batch();
  const timestamp = admin.firestore.Timestamp.now();
  for (const userId of recipients) {
    const ref = db.collection('notifications').doc();
    batch.set(ref, { userId, type, message, read: false, createdAt: timestamp });
  }
  await batch.commit();
}

/**
 * Dispara um evento de notificação baseado nas regras definidas.
 */
export async function dispararEvento(
  evento: string,
  remetenteId: string,
  dados: any
): Promise<void> {
  const regra = regras.find(r => r.evento === evento);
  if (!regra) {
    console.warn(`Regra não encontrada para evento: ${evento}`);
    return;
  }

  const message = regra.template(dados);
  const recipientsArrays = await Promise.all(
    regra.destinatariosRoles.map(role => buscarUsuariosPorRole(role))
  );
  const recipients = Array.from(new Set(recipientsArrays.flat())).filter(
    id => id !== remetenteId
  );

  await distribuirNotificacao(recipients, evento, message);
}
