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
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function mentoriaRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para agendar mentoria - Acesso para Mentorandos
        app.post('/mentoria/agendar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Utiliza o ID do usuário autenticado ou, se ausente, o enviado no corpo da requisição
            const usuarioId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.body.usuarioId;
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
                const newSession = yield firebaseConfig_1.default.collection('sessaoMentoria').add({
                    usuarioId,
                    mentorId,
                    data,
                    horario,
                    planoMentoria,
                    categoria,
                    status: 'pendente', // Status inicial
                    dataCriacao: new Date(),
                    dataHoraInicio: dataHoraInicio, // salva data/hora de início
                    dataHoraFim: dataHoraFim // salva data/hora de término
                });
                return reply
                    .status(201)
                    .send({ message: 'Mentoria solicitada com sucesso.', id: newSession.id });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao solicitar mentoria.' });
            }
        }));
        // Rota para aceitar uma mentoria (Mentor)
        app.patch('/mentoria/aceitar/:sessaoId', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { sessaoId } = req.params;
            try {
                const sessaoRef = firebaseConfig_1.default.collection('sessaoMentoria').doc(sessaoId);
                const sessao = yield sessaoRef.get();
                if (!sessao.exists) {
                    return reply.status(404).send({ message: 'Sessão de mentoria não encontrada.' });
                }
                yield sessaoRef.update({ status: 'aceita' });
                return reply.send({ message: 'Mentoria aceita com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao aceitar mentoria.' });
            }
        }));
        // Rota para rejeitar uma mentoria (Mentor)
        app.patch('/mentoria/rejeitar/:sessaoId', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { sessaoId } = req.params;
            const { motivo } = req.body;
            try {
                const sessaoRef = firebaseConfig_1.default.collection('sessaoMentoria').doc(sessaoId);
                const sessao = yield sessaoRef.get();
                if (!sessao.exists) {
                    return reply.status(404).send({ message: 'Sessão de mentoria não encontrada.' });
                }
                // Atualiza para rejeitada e armazena o motivo se fornecido
                yield sessaoRef.update({ status: 'rejeitada', motivoRejeicao: motivo || '' });
                return reply.send({ message: 'Mentoria rejeitada com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao rejeitar a mentoria.' });
            }
        }));
        // Rota para cancelar uma sessão (mentorando ou mentor cancela)
        // A regra é: a sessão pode ser cancelada se for feita com **24h de antecedência**
        app.patch('/mentoria/cancelar/:sessaoId', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { sessaoId } = req.params;
            const { motivo } = req.body;
            try {
                const sessaoRef = firebaseConfig_1.default.collection('sessaoMentoria').doc(sessaoId);
                const sessaoDoc = yield sessaoRef.get();
                if (!sessaoDoc.exists) {
                    return reply.status(404).send({ message: 'Sessão de mentoria não encontrada.' });
                }
                const sessao = sessaoDoc.data();
                if (!(sessao === null || sessao === void 0 ? void 0 : sessao.dataHoraInicio)) {
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
                yield sessaoRef.update({ status: 'cancelada', motivoCancelamento: motivo || '' });
                return reply.send({ message: 'Sessão cancelada com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao cancelar sessão.' });
            }
        }));
        // Rota para expirar sessões vencidas (Admin ou automação)
        // Atualiza o status para "expirada" se a dataHoraFim for menor que o horário atual
        app.patch('/mentoria/expirar-sessoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const agora = new Date();
                const snapshot = yield firebaseConfig_1.default
                    .collection('sessaoMentoria')
                    .where('status', 'in', ['pendente', 'aceita'])
                    .get();
                const sessoesExpiradas = [];
                const batch = firebaseConfig_1.default.batch();
                snapshot.forEach((doc) => {
                    const sessao = doc.data();
                    if (!(sessao === null || sessao === void 0 ? void 0 : sessao.dataHoraFim))
                        return;
                    const dataHoraFim = new Date(sessao.dataHoraFim);
                    if (agora > dataHoraFim) {
                        batch.update(doc.ref, { status: 'expirada' });
                        sessoesExpiradas.push(doc.id);
                    }
                });
                if (sessoesExpiradas.length > 0) {
                    yield batch.commit();
                }
                return reply.send({
                    message: `${sessoesExpiradas.length} sessões expirada(s).`,
                    sessoesExpiradas,
                });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao expirar sessões.' });
            }
        }));
        // Rota para buscar sessões filtradas pelo mentor (Mentor - pendentes/aceitas)
        // Rota para buscar sessões filtradas por mentor e/ou mentorando (Mentor ou Admin)
        app.get('/mentoria/sessoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { mentorId, usuarioId, status } = req.query;
            try {
                let query = firebaseConfig_1.default.collection('sessaoMentoria');
                // Adiciona os filtros dinamicamente conforme os parâmetros recebidos
                if (mentorId)
                    query = query.where('mentorId', '==', mentorId);
                if (usuarioId)
                    query = query.where('usuarioId', '==', usuarioId);
                if (status)
                    query = query.where('status', '==', status);
                const snapshot = yield query.get();
                const sessions = snapshot.docs.map(doc => (Object.assign({ sessaoId: doc.id }, doc.data())));
                return reply.send(sessions);
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar sessões.' });
            }
        }));
        // Rota para que o mentorando consulte as suas sessões (Mentorando)
        app.get('/mentoria/minhas-sessoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Usa o ID do usuário presente no token ou, se não houver, na query string
            const usuarioId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.query.usuarioId;
            if (!usuarioId) {
                return reply
                    .status(400)
                    .send({ message: 'Usuário não identificado.' });
            }
            try {
                const snapshot = yield firebaseConfig_1.default
                    .collection('sessaoMentoria')
                    .where('usuarioId', '==', usuarioId)
                    .get();
                const sessions = snapshot.docs.map(doc => (Object.assign({ sessaoId: doc.id }, doc.data())));
                return reply.send(sessions);
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar suas sessões.' });
            }
        }));
        // Rota para que o admin visualize todas as sessões (Admin)
        app.get('/admin/mentorias', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const snapshot = yield firebaseConfig_1.default.collection('sessaoMentoria').get();
                const sessions = snapshot.docs.map(doc => (Object.assign({ sessaoId: doc.id }, doc.data())));
                return reply.send(sessions);
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar sessões para o admin.' });
            }
        }));
    });
}
