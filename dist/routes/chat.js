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
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
// Função auxiliar para registrar atividade (fire-and-forget)
function registrarAtividade(userId, descricao, acao) {
    firebaseConfig_1.default.collection('atividades').add({
        userId,
        description: descricao,
        action: acao,
        createdAt: new Date(),
    }).catch(error => {
        console.error('Erro ao registrar atividade:', error);
    });
}
function chatRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para enviar mensagem no chat (disponível apenas se a sessão estiver em curso)
        app.post('/chat/enviar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const body = req.body;
                if (!(body === null || body === void 0 ? void 0 : body.sessaoId) || !(body === null || body === void 0 ? void 0 : body.remetenteId) || !(body === null || body === void 0 ? void 0 : body.mensagem)) {
                    return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
                }
                // Verifica se a sessão existe
                const sessaoRef = firebaseConfig_1.default.collection('sessaoMentoria').doc(body.sessaoId);
                const sessao = yield sessaoRef.get();
                if (!sessao.exists) {
                    return reply.status(403).send({ message: 'Sessão de mentoria não encontrada.' });
                }
                // Permite envio apenas se a sessão estiver "em_curso"
                const statusSessao = (_a = sessao.data()) === null || _a === void 0 ? void 0 : _a.status;
                if (statusSessao !== 'em_curso') {
                    return reply.status(403).send({ message: 'Envio de mensagem não permitido para sessão finalizada.' });
                }
                // Salva a mensagem no Firestore
                const chatRef = firebaseConfig_1.default.collection('chats').doc(body.sessaoId);
                yield chatRef.collection('mensagens').add({
                    remetenteId: body.remetenteId,
                    mensagem: body.mensagem,
                    timestamp: new Date(),
                });
                // Registra a atividade de envio de mensagem (fire-and-forget)
                registrarAtividade(body.remetenteId, `Mensagem enviada com sucesso no chat da sessão ${body.sessaoId}.`, 'Envio de mensagem');
                return reply.send({ message: 'Mensagem enviada com sucesso.' });
            }
            catch (error) {
                console.error("Erro ao enviar mensagem:", error);
                return reply.status(500).send({ message: 'Erro ao enviar mensagem.' });
            }
        }));
        // Rota para listar mensagens da sessão de mentoria
        app.get('/chat/mensagens/:sessaoId', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessaoId } = req.params;
                if (!sessaoId) {
                    return reply.status(400).send({ message: 'Sessão inválida.' });
                }
                const mensagensRef = firebaseConfig_1.default.collection('chats')
                    .doc(sessaoId)
                    .collection('mensagens')
                    .orderBy('timestamp', 'asc');
                const mensagensSnapshot = yield mensagensRef.get();
                const mensagens = mensagensSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.send(mensagens);
            }
            catch (error) {
                console.error("Erro ao buscar mensagens:", error);
                return reply.status(500).send({ message: 'Erro ao buscar mensagens.' });
            }
        }));
        // Rota para verificar a sessão de mentoria entre usuário e mentor
        // Retorna a sessão mais recente com status "em_curso" ou "finalizada"
        app.post('/mentoria/verificar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const body = req.body;
                const { usuarioId, mentorId } = body;
                if (!usuarioId || !mentorId) {
                    return reply.status(400).send({ message: 'usuarioId e mentorId são obrigatórios.' });
                }
                const snapshot = yield firebaseConfig_1.default
                    .collection('sessaoMentoria')
                    .where('usuarioId', '==', usuarioId)
                    .where('mentorId', '==', mentorId)
                    .get();
                if (snapshot.empty) {
                    return reply.status(404).send({ message: 'Nenhuma sessão de mentoria encontrada.' });
                }
                const sessoesValidas = snapshot.docs
                    .map(doc => {
                    const data = doc.data();
                    return Object.assign({ id: doc.id }, data);
                })
                    .filter(sessao => sessao.status === 'em_curso' || sessao.status === 'finalizada')
                    .sort((a, b) => { var _a, _b, _c, _d; return (((_b = (_a = b.createdAt) === null || _a === void 0 ? void 0 : _a.toMillis) === null || _b === void 0 ? void 0 : _b.call(_a)) || 0) - (((_d = (_c = a.createdAt) === null || _c === void 0 ? void 0 : _c.toMillis) === null || _d === void 0 ? void 0 : _d.call(_c)) || 0); });
                if (sessoesValidas.length === 0) {
                    return reply.status(404).send({ message: 'Nenhuma sessão de mentoria ativa ou finalizada encontrada.' });
                }
                const sessaoMaisRecente = sessoesValidas[0];
                registrarAtividade(usuarioId, `Sessão de mentoria com o mentor ${mentorId} verificada com sucesso.`, 'Verificação de mentoria');
                return reply.send(Object.assign({ sessaoId: sessaoMaisRecente.id }, sessaoMaisRecente));
            }
            catch (error) {
                console.error("Erro ao verificar mentoria:", error);
                return reply.status(500).send({ message: 'Erro ao verificar mentoria.' });
            }
        }));
        // Rota para enviar áudio como mensagem no chat (somente se a sessão estiver em curso)
        app.post('/chat/enviar-audio', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const body = req.body;
                if (!(body === null || body === void 0 ? void 0 : body.sessaoId) || !(body === null || body === void 0 ? void 0 : body.remetenteId) || !(body === null || body === void 0 ? void 0 : body.mensagem)) {
                    return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
                }
                // Verifica se a sessão existe
                const sessaoRef = firebaseConfig_1.default.collection('sessaoMentoria').doc(body.sessaoId);
                const sessao = yield sessaoRef.get();
                if (!sessao.exists) {
                    return reply.status(403).send({ message: 'Sessão de mentoria não encontrada.' });
                }
                // Permite envio de áudio apenas se a sessão estiver "em_curso"
                const statusSessao = (_a = sessao.data()) === null || _a === void 0 ? void 0 : _a.status;
                if (statusSessao !== 'em_curso') {
                    return reply.status(403).send({ message: 'Envio de áudio não permitido para sessão finalizada.' });
                }
                // Salva a mensagem de áudio no Firestore, marcando o tipo como "audio"
                const chatRef = firebaseConfig_1.default.collection('chats').doc(body.sessaoId);
                yield chatRef.collection('mensagens').add({
                    remetenteId: body.remetenteId,
                    mensagem: body.mensagem, // URI (ou URL) do áudio
                    tipo: 'audio',
                    timestamp: new Date(),
                });
                // Registra a atividade de envio de áudio (fire-and-forget)
                registrarAtividade(body.remetenteId, `Áudio enviado com sucesso no chat da sessão ${body.sessaoId}.`, 'Envio de áudio');
                return reply.send({ message: 'Áudio enviado com sucesso.' });
            }
            catch (error) {
                console.error("Erro ao enviar áudio:", error);
                return reply.status(500).send({ message: 'Erro ao enviar áudio.' });
            }
        }));
    });
}
exports.default = chatRoutes;
