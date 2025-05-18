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
exports.default = mentoriaRoutes;
const firestore_1 = require("firebase-admin/firestore");
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
const notificationsservice_1 = require("./notificationsservice");
// Helper to parse timestamp
function converterTimestampParaDate(val) {
    if (val instanceof firestore_1.Timestamp)
        return val.toDate();
    return new Date(val);
}
function criarDataHoraLocal(data, horario) {
    const [ano, mes, dia] = data.split('-').map(Number);
    const [hora, minuto] = horario.split(':').map(Number);
    return new Date(ano, mes - 1, dia, hora, minuto);
}
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
            const snap = yield firebaseConfig_1.default.collection('sessaoMentoria')
                .where('mentorId', '==', sessaoData.mentorId)
                .where('status', '==', 'em_curso')
                .where('dataHoraFim', '>', inicio)
                .get();
            if (snap.empty) {
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
        // Agendar sessão
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
                if (dataHoraInicio <= new Date()) {
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
                const descricao = `Agendou uma sessão de mentoria para ${data} às ${horario}.`;
                (0, notificationsservice_1.registrarAtividade)(usuarioId, descricao, 'mentoria.agendar');
                // Notificação
                yield (0, notificationsservice_1.dispararEvento)('mentoria.agendar', usuarioId, { usuarioNome: usuarioId, data, horario });
                return reply.status(201).send({ message: 'Mentoria solicitada com sucesso.', id: newSession.id });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao solicitar mentoria.' });
            }
        }));
        // Expirar sessões
        app.patch('/mentoria/expirar-sessoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const snapshot = yield firebaseConfig_1.default.collection('sessaoMentoria')
                    .where('status', 'in', ['pendente', 'aceita', 'em_curso'])
                    .get();
                let atualizadas = 0;
                for (const doc of snapshot.docs) {
                    const novo = yield verificarEAtualizarSessao(doc.id, doc.data());
                    if (novo !== doc.data().status)
                        atualizadas++;
                }
                return reply.send({ message: `${atualizadas} sessões atualizadas.` });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao atualizar sessões.' });
            }
        }));
        // Aceitar sessão
        app.patch('/mentoria/:id/aceitar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            try {
                yield firebaseConfig_1.default.collection('sessaoMentoria').doc(id).update({ status: 'aceita' });
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'sistema';
                (0, notificationsservice_1.registrarAtividade)(userId, 'Sessão de mentoria aceita.', 'mentoria.aceitar');
                yield (0, notificationsservice_1.dispararEvento)('mentoria.aceitar', userId, { mentorNome: userId });
                return reply.send({ message: 'Mentoria aceita com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao aceitar mentoria.' });
            }
        }));
        // Rejeitar sessão
        app.patch('/mentoria/:id/rejeitar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const { motivo } = req.body;
            try {
                yield firebaseConfig_1.default.collection('sessaoMentoria').doc(id).update({ status: 'rejeitada', motivoRejeicao: motivo });
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'sistema';
                (0, notificationsservice_1.registrarAtividade)(userId, `Sessão rejeitada. Motivo: ${motivo}.`, 'mentoria.rejeitar');
                yield (0, notificationsservice_1.dispararEvento)('mentoria.rejeitar', userId, { mentorNome: userId, motivo });
                return reply.send({ message: 'Mentoria rejeitada com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao rejeitar mentoria.' });
            }
        }));
        // Cancelar sessão
        app.patch('/mentoria/:id/cancelar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const { motivo } = req.body;
            try {
                yield firebaseConfig_1.default.collection('sessaoMentoria').doc(id).update({ status: 'cancelada', motivoCancelamento: motivo });
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'sistema';
                (0, notificationsservice_1.registrarAtividade)(userId, `Sessão cancelada. Motivo: ${motivo}.`, 'mentoria.cancelar');
                yield (0, notificationsservice_1.dispararEvento)('mentoria.cancelar', userId, { usuarioNome: userId, motivo });
                return reply.send({ message: 'Mentoria cancelada com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao cancelar mentoria.' });
            }
        }));
        // Listar todas as mentorias
        app.get('/mentoria', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const snapshot = yield firebaseConfig_1.default.collection('sessaoMentoria').get();
                const mentorias = yield Promise.all(snapshot.docs.map((doc) => __awaiter(this, void 0, void 0, function* () {
                    const data = doc.data();
                    const status = yield verificarEAtualizarSessao(doc.id, data);
                    return Object.assign(Object.assign({ sessaoId: doc.id }, data), { status });
                })));
                return reply.send(mentorias);
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar mentorias.' });
            }
        }));
        // Listar por filtro
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
                const sessoes = [];
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    const newStatus = yield verificarEAtualizarSessao(doc.id, data);
                    sessoes.push(Object.assign(Object.assign({ sessaoId: doc.id }, data), { status: newStatus }));
                }
                return reply.send({ sessoes });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar sessões.' });
            }
        }));
        // Minhas sessões
        app.get('/mentoria/minhas-sessoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const usuarioId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.query.usuarioId;
            if (!usuarioId)
                return reply.status(400).send({ message: 'Usuário não informado.' });
            try {
                const snapshot = yield firebaseConfig_1.default.collection('sessaoMentoria').where('usuarioId', '==', usuarioId).get();
                const sessoes = [];
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    const newStatus = yield verificarEAtualizarSessao(doc.id, data);
                    sessoes.push(Object.assign(Object.assign({ sessaoId: doc.id }, data), { status: newStatus }));
                }
                return reply.send({ sessoes });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar sessões do usuário.' });
            }
        }));
        // Avaliar sessão
        app.post('/mentoria/:id/avaliar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { nota, comentario, avaliadorId } = req.body;
            if (nota < 1 || nota > 5)
                return reply.status(400).send({ message: 'A nota deve estar entre 1 e 5.' });
            try {
                yield firebaseConfig_1.default.collection('sessaoMentoria').doc(id).update({
                    avaliacao: { nota, comentario: comentario || '', avaliadorId, data: new Date() }
                });
                const descricao = `Sessão de mentoria avaliada com nota ${nota}.`;
                (0, notificationsservice_1.registrarAtividade)(avaliadorId, descricao, 'mentoria.finalizar');
                yield (0, notificationsservice_1.dispararEvento)('mentoria.finalizar', avaliadorId, { mentorNome: avaliadorId });
                return reply.send({ message: 'Avaliação registrada com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao registrar avaliação.' });
            }
        }));
    });
}
