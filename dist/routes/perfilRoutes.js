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
exports.default = profileRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
const notificationsservice_1 = require("./notificationsservice");
function profileRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para obter o perfil de um usuário específico
        app.get('/perfil/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const userDoc = yield firebaseConfig_1.default.collection('usuarios').doc(id).get();
                if (!userDoc.exists)
                    return reply.status(404).send({ message: 'Usuário não encontrado' });
                return reply.send(userDoc.data());
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao buscar perfil', error });
            }
        }));
        // Rota para atualizar o perfil do usuário (com suporte para mentor e notificações)
        app.patch('/perfil/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const { nome, bio, profileImage, sobre, role } = req.body;
            try {
                const userRef = firebaseConfig_1.default.collection('usuarios').doc(id);
                const userDoc = yield userRef.get();
                if (!userDoc.exists)
                    return reply.status(404).send({ message: 'Usuário não encontrado.' });
                const prevData = userDoc.data();
                const wasMentor = ((_a = prevData.tipo_de_usuario) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'MENTOR';
                const isMentor = ((role === null || role === void 0 ? void 0 : role.toUpperCase()) === 'MENTOR') || wasMentor;
                const updateData = {};
                if (nome)
                    updateData.nome = nome;
                if (bio)
                    updateData.bio = bio;
                if (profileImage)
                    updateData.profileImage = profileImage;
                if (isMentor && sobre)
                    updateData.sobre = sobre;
                if (role)
                    updateData.tipo_de_usuario = role.toUpperCase();
                yield userRef.update(updateData);
                const displayName = nome || prevData.nome || 'Usuário';
                const descricao = `${displayName} atualizou seu perfil.`;
                const acao = 'Atualizar perfil';
                yield (0, notificationsservice_1.registrarAtividade)(id, descricao, acao);
                // Notificar grupo oposto: users se mentor, mentors se user
                const targetRole = isMentor ? 'user' : 'mentor';
                let destinatarios = yield (0, notificationsservice_1.buscarUsuariosPorRole)(targetRole);
                destinatarios = destinatarios.filter(uid => uid !== id);
                if (destinatarios.length) {
                    yield (0, notificationsservice_1.distribuirNotificacao)(destinatarios, acao, descricao);
                }
                return reply.send({ message: 'Perfil atualizado com sucesso' });
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao atualizar perfil', error });
            }
        }));
        // Nova rota para buscar todos os mentores
        app.get('/mentores', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const snapshot = yield firebaseConfig_1.default.collection('usuarios').where('tipo_de_usuario', '==', 'MENTOR').get();
                if (snapshot.empty)
                    return reply.status(404).send({ message: 'Nenhum mentor encontrado' });
                const mentores = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.send(mentores);
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao buscar mentores', error });
            }
        }));
    });
}
