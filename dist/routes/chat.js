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
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function chatRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para enviar mensagem no chat
        app.post('/chat/enviar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const body = req.body;
                if (!(body === null || body === void 0 ? void 0 : body.sessaoId) || !(body === null || body === void 0 ? void 0 : body.remetenteId) || !(body === null || body === void 0 ? void 0 : body.mensagem)) {
                    return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
                }
                // Verifica se a sessão existe e foi aceita
                const sessaoRef = firebaseConfig_1.default.collection('sessaoMentoria').doc(body.sessaoId);
                const sessao = yield sessaoRef.get();
                if (!sessao.exists || ((_a = sessao.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'aceita') {
                    return reply.status(403).send({ message: 'Sessão de mentoria não ativa.' });
                }
                // Salvar mensagem no Firestore
                const chatRef = firebaseConfig_1.default.collection('chats').doc(body.sessaoId);
                yield chatRef.collection('mensagens').add({
                    remetenteId: body.remetenteId,
                    mensagem: body.mensagem,
                    timestamp: new Date(),
                });
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
                const mensagensRef = firebaseConfig_1.default.collection('chats').doc(sessaoId).collection('mensagens').orderBy('timestamp', 'asc');
                const mensagensSnapshot = yield mensagensRef.get();
                const mensagens = mensagensSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.send(mensagens);
            }
            catch (error) {
                console.error("Erro ao buscar mensagens:", error);
                return reply.status(500).send({ message: 'Erro ao buscar mensagens.' });
            }
        }));
        // Nova rota para verificar a sessão de mentoria ativa entre um usuário e um mentor
        app.post('/mentoria/verificar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const body = req.body;
                const { usuarioId, mentorId } = body;
                if (!usuarioId || !mentorId) {
                    return reply.status(400).send({ message: 'usuarioId e mentorId são obrigatórios.' });
                }
                // Consulta a coleção "sessaoMentoria" para encontrar uma sessão com status "aceita"
                const snapshot = yield firebaseConfig_1.default
                    .collection('sessaoMentoria')
                    .where('usuarioId', '==', usuarioId)
                    .where('mentorId', '==', mentorId)
                    .where('status', '==', 'aceita')
                    .get();
                if (snapshot.empty) {
                    return reply
                        .status(404)
                        .send({ message: 'Nenhuma sessão de mentoria ativa encontrada.' });
                }
                // Supondo que apenas uma sessão ativa exista para essa combinação
                const sessaoDoc = snapshot.docs[0];
                return reply.send(Object.assign({ sessaoId: sessaoDoc.id }, sessaoDoc.data()));
            }
            catch (error) {
                console.error("Erro ao verificar mentoria:", error);
                return reply.status(500).send({ message: 'Erro ao verificar mentoria.' });
            }
        }));
        // Rota para enviar áudio como mensagem no chat
        app.post('/chat/enviar-audio', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const body = req.body;
                if (!(body === null || body === void 0 ? void 0 : body.sessaoId) || !(body === null || body === void 0 ? void 0 : body.remetenteId) || !(body === null || body === void 0 ? void 0 : body.mensagem)) {
                    return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
                }
                // Verifica se a sessão existe e foi aceita
                const sessaoRef = firebaseConfig_1.default.collection('sessaoMentoria').doc(body.sessaoId);
                const sessao = yield sessaoRef.get();
                if (!sessao.exists || ((_a = sessao.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'aceita') {
                    return reply.status(403).send({ message: 'Sessão de mentoria não ativa.' });
                }
                // Salva a mensagem de áudio no Firestore, marcando o tipo como "audio"
                const chatRef = firebaseConfig_1.default.collection('chats').doc(body.sessaoId);
                yield chatRef.collection('mensagens').add({
                    remetenteId: body.remetenteId,
                    mensagem: body.mensagem, // Aqui você envia o URI (ou URL) do áudio
                    tipo: 'audio',
                    timestamp: new Date(),
                });
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
