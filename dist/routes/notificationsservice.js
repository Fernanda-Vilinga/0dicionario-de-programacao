"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarAtividade = registrarAtividade;
exports.buscarUsuariosPorRole = buscarUsuariosPorRole;
exports.distribuirNotificacao = distribuirNotificacao;
exports.dispararEvento = dispararEvento;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Central de regras baseada na TABELA PRINCIPAL
const regras = [
    // Perfil
    {
        evento: 'perfil.atualizar.user',
        remetenteRole: 'USER',
        destinatariosRoles: ['MENTOR', 'ADMIN'],
        template: ({ nome }) => `${nome} atualizou seu perfil.`,
    },
    {
        evento: 'perfil.atualizar.mentor',
        remetenteRole: 'MENTOR',
        destinatariosRoles: ['USER', 'ADMIN'],
        template: ({ nome }) => `${nome} atualizou seu perfil de mentor.`,
    },
    // Quiz
    {
        evento: 'quiz.criar',
        remetenteRole: 'ADMIN',
        destinatariosRoles: ['USER', 'ADMIN'],
        template: ({ titulo }) => `🎯 Novo quiz publicado: "${titulo}"`,
    },
    {
        evento: 'quiz.atualizar',
        remetenteRole: 'ADMIN',
        destinatariosRoles: ['USER', 'ADMIN'],
        template: ({ perguntaId }) => `🔄 Quiz atualizado (ID: ${perguntaId})`,
    },
    // Dicionário
    {
        evento: 'dicionario.adicionar',
        remetenteRole: 'ADMIN',
        destinatariosRoles: ['USER', 'ADMIN'],
        template: ({ termo }) => `✅ Novo termo adicionado: "${termo}"`,
        agrupar: true,
    },
    {
        evento: 'dicionario.atualizar',
        remetenteRole: 'ADMIN',
        destinatariosRoles: ['USER', 'ADMIN'],
        template: ({ termo }) => `🔄 Termo "${termo}" foi atualizado.`,
        agrupar: true,
    },
    // Sugestões
    {
        evento: 'sugestao.criar',
        remetenteRole: 'USER',
        destinatariosRoles: ['ADMIN'],
        template: ({ categoria }) => `💡 Nova sugestão recebida: "${categoria}"`,
    },
    {
        evento: 'sugestao.atualizar',
        remetenteRole: 'ADMIN',
        destinatariosRoles: ['USER', 'ADMIN'],
        template: ({ status }) => {
            if (status === 'aceita')
                return `✅ A Sugestão foi aceita.`;
            if (status === 'rejeitada')
                return `❌ A sugestão foi rejeitada.`;
            return `🔄 O pedido de sugestão está "${status}".`;
        },
    },
    // Mentoria
    {
        evento: 'mentoria.agendar',
        remetenteRole: 'USER',
        destinatariosRoles: ['MENTOR', 'ADMIN'],
        template: ({ usuarioNome, data, horario }) => `🗓 Sua mentoria com ${usuarioNome} está agendada para ${data} às ${horario}.`,
    },
    {
        evento: 'mentoria.iniciar',
        remetenteRole: 'SISTEMA',
        destinatariosRoles: ['USER', 'MENTOR'],
        template: ({ mentorNome }) => `🔔 Sua mentoria com ${mentorNome} entrou em curso! Entre no chat.`,
    },
    {
        evento: 'mentoria.aceitar',
        remetenteRole: 'MENTOR',
        destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
        // template: ({ mentorNome }: any) => `✅ Sua mentoria foi aceita por ${mentorNome}.`,
        template: ({ mentorNome }) => `✅ Sua mentoria foi aceita.`,
    },
    {
        evento: 'mentoria.rejeitar',
        remetenteRole: 'MENTOR',
        destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
        template: ({ mentorNome, motivo }) => `❌ A sessão com ${mentorNome} foi rejeitada. Motivo: ${motivo}.`,
    },
    {
        evento: 'mentoria.cancelar',
        remetenteRole: 'USER',
        destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
        template: ({ usuarioNome, motivo }) => `❌ A sessão com ${usuarioNome} foi cancelada. Motivo: ${motivo}.`,
    },
    {
        evento: 'mentoria.finalizar',
        remetenteRole: 'SISTEMA',
        destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
        template: ({ mentorNome }) => `✅ Sua mentoria com ${mentorNome} foi finalizada com sucesso.`,
    },
    {
        evento: 'mentoria.expirada',
        remetenteRole: 'SISTEMA',
        destinatariosRoles: ['USER', 'MENTOR', 'ADMIN'],
        template: ({ mentorNome }) => `⏰ Sua mentoria com ${mentorNome} expirou.`,
    },
    // → Suas novas regras de “promoção”:
    {
        evento: 'promocao.solicitar',
        remetenteRole: 'USER',
        destinatariosRoles: ['ADMIN'],
        template: ({ email, tipoSolicitado }) => `💼 Novo pedido de promoção: ${email} → ${tipoSolicitado}.`,
    },
    {
        evento: 'promocao.aprovada',
        remetenteRole: 'ADMIN',
        destinatariosRoles: ['USER'],
        template: ({ nome, novoTipo }) => `✅ Sua promoção para ${novoTipo} foi aprovada, ${nome}!`,
    },
    {
        evento: 'promocao.rejeitada',
        remetenteRole: 'ADMIN',
        destinatariosRoles: ['USER'],
        template: ({ nome }) => `❌ Sua solicitação de promoção foi rejeitada, ${nome}.`,
    },
];
/**
 * Registra um log de atividade na coleção 'atividades'.
 */
function registrarAtividade(userId, description, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const timestamp = firebase_admin_1.default.firestore.Timestamp.now();
        yield firebaseConfig_1.default.collection('atividades').add({ userId, description, action, createdAt: timestamp });
    });
}
/**
 * Busca lista de userIds pelo papel.
 */
function buscarUsuariosPorRole(role) {
    return __awaiter(this, void 0, void 0, function* () {
        const tipo = role.toUpperCase();
        const snap = yield firebaseConfig_1.default.collection('usuarios').where('tipo_de_usuario', '==', tipo).get();
        return snap.docs.map(doc => doc.id);
    });
}
/**
 * Envia notificações em batch para múltiplos usuários.
 */
function distribuirNotificacao(recipients, type, message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!recipients.length)
            return;
        const batch = firebaseConfig_1.default.batch();
        const timestamp = firebase_admin_1.default.firestore.Timestamp.now();
        for (const userId of recipients) {
            const ref = firebaseConfig_1.default.collection('notifications').doc();
            batch.set(ref, { userId, type, message, read: false, createdAt: timestamp });
        }
        yield batch.commit();
    });
}
/**
 * Dispara um evento de notificação baseado nas regras definidas.
 */
function dispararEvento(evento, remetenteId, dados) {
    return __awaiter(this, void 0, void 0, function* () {
        const regra = regras.find(r => r.evento === evento);
        if (!regra) {
            console.warn(`Regra não encontrada para evento: ${evento}`);
            return;
        }
        const message = regra.template(dados);
        const recipientsArrays = yield Promise.all(regra.destinatariosRoles.map(role => buscarUsuariosPorRole(role)));
        const recipients = Array.from(new Set(recipientsArrays.flat())).filter(id => id !== remetenteId);
        yield distribuirNotificacao(recipients, evento, message);
    });
}
