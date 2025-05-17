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
exports.default = suggestsRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const notificationsservice_1 = require("./notificationsservice");
function suggestsRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Enviar sugestão: notifica admins
        app.post('/sugestoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, categoria, descricao, status } = req.body;
            if (!usuarioId || !categoria || !descricao) {
                return reply.status(400).send({ message: 'Dados inválidos' });
            }
            try {
                const nova = {
                    usuarioId,
                    categoria,
                    descricao,
                    status: status || 'pendente',
                    data: firebase_admin_1.default.firestore.Timestamp.now(),
                };
                const docRef = yield firebaseConfig_1.default.collection('sugestoes').add(nova);
                // registrar atividade e notificação para o autor
                const descAtiv = `Sugestão enviada para categoria \"${categoria}\".`;
                const acao = 'Enviar Sugestão';
                yield (0, notificationsservice_1.registrarAtividade)(usuarioId, descAtiv, acao);
                yield (0, notificationsservice_1.distribuirNotificacao)([usuarioId], acao, descAtiv);
                // notificar todos os admins
                const admins = yield (0, notificationsservice_1.buscarUsuariosPorRole)('admin');
                const msgAdmin = `Nova sugestão na categoria \"${categoria}\" de ${usuarioId}.`;
                yield (0, notificationsservice_1.distribuirNotificacao)(admins, 'Nova Sugestão', msgAdmin);
                return reply.status(201).send({ message: 'Sugestão recebida', id: docRef.id });
            }
            catch (error) {
                console.error('Erro ao enviar sugestão:', error);
                return reply.status(500).send({ message: 'Erro no servidor' });
            }
        }));
        // Listar sugestões (sem notificações)
        app.get('/sugestoes', (_, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const snapshot = yield firebaseConfig_1.default.collection('sugestoes').get();
                const sugestoes = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.status(200).send(sugestoes);
            }
            catch (error) {
                console.error('Erro ao buscar sugestões:', error);
                return reply.status(500).send({ message: 'Erro ao buscar sugestões' });
            }
        }));
        // Atualizar status da sugestão: notifica autor
        app.put('/sugestoes/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { status, usuarioId: bodyUser } = req.body;
            if (!status) {
                return reply.status(400).send({ message: 'Status não informado' });
            }
            try {
                const ref = firebaseConfig_1.default.collection('sugestoes').doc(id);
                const snap = yield ref.get();
                if (!snap.exists) {
                    return reply.status(404).send({ message: 'Sugestão não encontrada' });
                }
                const orig = snap.data();
                yield ref.update({ status });
                const autor = orig.usuarioId || bodyUser || 'sistema';
                const descAtiv = `Status da sugestão atualizado para \"${status}\".`;
                const acao = 'Atualizar Sugestão';
                yield (0, notificationsservice_1.registrarAtividade)(autor, descAtiv, acao);
                yield (0, notificationsservice_1.distribuirNotificacao)([autor], acao, descAtiv);
                return reply.status(200).send({ message: 'Status da sugestão atualizado' });
            }
            catch (error) {
                console.error('Erro ao atualizar status:', error);
                return reply.status(500).send({ message: 'Erro ao atualizar status' });
            }
        }));
    });
}
