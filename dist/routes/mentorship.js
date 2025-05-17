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
exports.default = mentoriaRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
// Função auxiliar para registrar atividade (fire-and-forget)
function registrarAtividade(userId, descricao, acao) {
    firebaseConfig_1.default.collection('atividades')
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
function criarDataHoraLocal(data, horario) {
    const [ano, mes, dia] = data.split('-').map(Number);
    const [hora, minuto] = horario.split(':').map(Number);
    return new Date(ano, mes - 1, dia, hora, minuto);
}
/**
 * Converte um timestamp do Firestore para objeto Date.
 * Se o valor já for Date ou string, tenta converter diretamente.
 */
const firestore_1 = require("firebase-admin/firestore");
function converterTimestampParaDate(timestamp) {
    if (timestamp instanceof firestore_1.Timestamp) {
        return timestamp.toDate();
    }
    // Se já for Date ou string/number convertível
    return new Date(timestamp);
}
/**
 * Verifica e atualiza o status de uma sessão.
 * - Se o status for "pendente" e já passou do início → "expirada".
 * - Se o status for "aceita" e o horário atual está entre o início e o fim:
 *     → Verifica se já não existe outra sessão "em_curso" para este mentor.
 *       Se não houver, atualiza para "em_curso". Caso haja, atualiza para "cancelada".
 * - Se o status for "aceita" ou "em_curso" e já passou do fim → "finalizada".
 */
function verificarEAtualizarSessao(docId, sessaoData) {
    return __awaiter(this, void 0, void 0, function* () {
        const agora = new Date();
        const inicio = converterTimestampParaDate(sessaoData.dataHoraInicio);
        const fim = converterTimestampParaDate(sessaoData.dataHoraFim);
        let novoStatus = sessaoData.status;
        if (sessaoData.status === 'pendente' && agora > inicio) {
            novoStatus = 'expirada';
        }
        else if (sessaoData.status === 'aceita' && agora >= inicio && agora < fim) {
            // Verifica se já existe uma sessão em curso para este mentor neste horário
            const snapshot = yield firebaseConfig_1.default.collection('sessaoMentoria')
                .where('mentorId', '==', sessaoData.mentorId)
                .where('status', '==', 'em_curso')
                .where('dataHoraFim', '>', inicio)
                .get();
            if (snapshot.empty) {
                novoStatus = 'em_curso';
            }
            else {
                novoStatus = 'cancelada';
                yield firebaseConfig_1.default.collection('sessaoMentoria').doc(docId).update({
                    status: 'cancelada',
                    motivoCancelamento: 'Choque de horário com outra sessão.'
                });
            }
        }
        else if ((sessaoData.status === 'aceita' || sessaoData.status === 'em_curso') && agora >= fim) {
            novoStatus = 'finalizada';
        }
        if (novoStatus !== sessaoData.status) {
            yield firebaseConfig_1.default.collection('sessaoMentoria').doc(docId).update({ status: novoStatus });
        }
        return novoStatus;
    });
}
function mentoriaRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para agendar sessão
        app.post('/mentoria/agendar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const usuarioId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.body.usuarioId;
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
                const newSession = yield firebaseConfig_1.default.collection('sessaoMentoria').add({
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
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao solicitar mentoria.' });
            }
        }));
        // Rota para atualizar sessões vencidas / em curso / finalizadas
        app.patch('/mentoria/expirar-sessoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const snapshot = yield firebaseConfig_1.default.collection('sessaoMentoria')
                    .where('status', 'in', ['pendente', 'aceita', 'em_curso'])
                    .get();
                let atualizadas = 0;
                for (const doc of snapshot.docs) {
                    const sessao = doc.data();
                    if (!(sessao === null || sessao === void 0 ? void 0 : sessao.dataHoraInicio))
                        continue;
                    const novoStatus = yield verificarEAtualizarSessao(doc.id, sessao);
                    if (novoStatus !== sessao.status)
                        atualizadas++;
                }
                return reply.send({ message: `${atualizadas} sessões atualizadas com novo status.` });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao atualizar sessões vencidas.' });
            }
        }));
        // Rota para aceitar sessão
        app.patch('/mentoria/:id/aceitar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            try {
                yield firebaseConfig_1.default.collection('sessaoMentoria').doc(id).update({ status: 'aceita' });
                // Registra atividade de aceitação (fire-and-forget)
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'sistema';
                const descricao = `Sessão de mentoria aceita com sucesso.`;
                const acao = "Aceitar Mentoria";
                registrarAtividade(userId, descricao, acao);
                return reply.send({ message: 'Mentoria aceita com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao aceitar mentoria.' });
            }
        }));
        // Rota para rejeitar sessão
        app.patch('/mentoria/:id/rejeitar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const { motivo } = req.body;
            try {
                yield firebaseConfig_1.default.collection('sessaoMentoria').doc(id).update({ status: 'rejeitada', motivoRejeicao: motivo });
                // Registra atividade de rejeição (fire-and-forget)
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'sistema';
                const descricao = `Sessão de mentoria cancelada. Motivo: ${motivo || 'não informado'}.`;
                const acao = "Rejeitar Mentoria";
                registrarAtividade(userId, descricao, acao);
                return reply.send({ message: 'Mentoria rejeitada com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao rejeitar mentoria.' });
            }
        }));
        // Rota para cancelar sessão
        app.patch('/mentoria/:id/cancelar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const { motivo } = req.body;
            try {
                yield firebaseConfig_1.default.collection('sessaoMentoria').doc(id).update({ status: 'cancelada', motivoCancelamento: motivo });
                // Registra atividade de cancelamento (fire-and-forget)
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'sistema';
                const descricao = `Sessão de mentoria rejeitada. Motivo: ${motivo || 'não informado'}.`;
                const acao = "Rejeitar Mentoria";
                registrarAtividade(userId, descricao, acao);
                return reply.send({ message: 'Mentoria cancelada com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao cancelar mentoria.' });
            }
        }));
        // Rota para buscar todas as mentorias (lista completa com atualização automática)
        app.get('/mentoria', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const snapshot = yield firebaseConfig_1.default.collection('sessaoMentoria').get();
                const mentorias = yield Promise.all(snapshot.docs.map((doc) => __awaiter(this, void 0, void 0, function* () {
                    const data = doc.data();
                    const novoStatus = yield verificarEAtualizarSessao(doc.id, data);
                    return Object.assign(Object.assign({ sessaoId: doc.id }, data), { status: novoStatus });
                })));
                return reply.send(mentorias);
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar mentorias.' });
            }
        }));
        // Rota para buscar uma mentoria específica (com atualização automática)
        app.get('/mentoria/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const doc = yield firebaseConfig_1.default.collection('sessaoMentoria').doc(id).get();
                if (!doc.exists) {
                    return reply.status(404).send({ message: 'Mentoria não encontrada.' });
                }
                const data = doc.data();
                const novoStatus = yield verificarEAtualizarSessao(doc.id, data);
                return reply.send(Object.assign(Object.assign({ sessaoId: doc.id }, data), { status: novoStatus }));
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar mentoria.' });
            }
        }));
        // Rota para busca filtrada de sessões (com atualização automática de status)
        app.get('/mentoria/sessoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { status, mentorId, usuarioId } = req.query;
            try {
                let query = firebaseConfig_1.default.collection('sessaoMentoria');
                if (status)
                    query = query.where('status', '==', status);
                if (mentorId)
                    query = query.where('mentorId', '==', mentorId);
                if (usuarioId)
                    query = query.where('usuarioId', '==', usuarioId);
                const snapshot = yield query.get();
                if (snapshot.empty) {
                    return reply.send({ sessoes: [] });
                }
                const sessoes = yield Promise.all(snapshot.docs.map((doc) => __awaiter(this, void 0, void 0, function* () {
                    const data = doc.data();
                    const novoStatus = yield verificarEAtualizarSessao(doc.id, data);
                    return Object.assign(Object.assign({ sessaoId: doc.id }, data), { status: novoStatus });
                })));
                return reply.send({ sessoes });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar sessões.' });
            }
        }));
        // Rota para buscar as mentorias de um usuário específico
        app.get('/mentoria/minhas-sessoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const usuarioId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.query.usuarioId;
            if (!usuarioId) {
                return reply.status(400).send({ message: 'Usuário não informado.' });
            }
            try {
                const snapshot = yield firebaseConfig_1.default.collection('sessaoMentoria')
                    .where('usuarioId', '==', usuarioId)
                    .get();
                if (snapshot.empty) {
                    return reply.send({ sessoes: [] });
                }
                const sessoes = yield Promise.all(snapshot.docs.map((doc) => __awaiter(this, void 0, void 0, function* () {
                    const data = doc.data();
                    const novoStatus = yield verificarEAtualizarSessao(doc.id, data);
                    return Object.assign(Object.assign({ sessaoId: doc.id }, data), { status: novoStatus });
                })));
                return reply.send({ sessoes });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar as mentorias do usuário.' });
            }
        }));
        // Rota para avaliar sessão
        app.post('/mentoria/:id/avaliar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { nota, comentario, avaliadorId } = req.body;
            if (nota < 1 || nota > 5) {
                return reply.status(400).send({ message: 'A nota deve estar entre 1 e 5.' });
            }
            try {
                // Atualiza a sessão com a avaliação
                yield firebaseConfig_1.default.collection('sessaoMentoria').doc(id).update({
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
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao registrar avaliação.' });
            }
        }));
    });
}
