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
            const { sessaoId, remetenteId, mensagem } = req.body;
            if (!sessaoId || !remetenteId || !mensagem) {
                return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
            }
            try {
                // Verifica se a sessão existe e foi aceita
                const sessaoRef = firebaseConfig_1.default.collection('sessaoMentoria').doc(sessaoId);
                const sessao = yield sessaoRef.get();
                if (!sessao.exists || ((_a = sessao.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'aceita') {
                    return reply.status(403).send({ message: 'Sessão de mentoria não ativa.' });
                }
                // Salvar mensagem no Firestore
                const chatRef = firebaseConfig_1.default.collection('chats').doc(sessaoId);
                yield chatRef.collection('mensagens').add({
                    remetenteId,
                    mensagem,
                    timestamp: new Date(),
                });
                return reply.send({ message: 'Mensagem enviada com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao enviar mensagem.' });
            }
        }));
        // Rota para listar mensagens da sessão de mentoria
        app.get('/chat/mensagens/:sessaoId', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { sessaoId } = req.params;
            try {
                const mensagensRef = firebaseConfig_1.default.collection('chats').doc(sessaoId).collection('mensagens').orderBy('timestamp', 'asc');
                const mensagensSnapshot = yield mensagensRef.get();
                const mensagens = mensagensSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.send(mensagens);
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar mensagens.' });
            }
        }));
    });
}
exports.default = chatRoutes;
