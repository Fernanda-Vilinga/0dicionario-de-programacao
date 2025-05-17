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
exports.default = notificationsRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function notificationsRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Listar notificações de um usuário
        app.get('/notifications/user/:userId', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.params;
            try {
                const snap = yield firebaseConfig_1.default
                    .collection('notifications')
                    .where('userId', '==', userId)
                    .orderBy('createdAt', 'desc')
                    .get();
                const notifications = snap.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        userId: data.userId,
                        type: data.type,
                        message: data.message,
                        read: data.read,
                        createdAt: data.createdAt.toDate().toISOString(),
                    };
                });
                return reply.send({ notifications });
            }
            catch (err) {
                console.error('Erro ao listar notifications:', err);
                return reply.status(500).send({ message: 'Erro interno' });
            }
        }));
        // Marcar uma notificação como lida
        app.put('/notifications/:id/read', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                yield firebaseConfig_1.default.collection('notifications').doc(id).update({ read: true });
                return reply.send({ ok: true });
            }
            catch (err) {
                console.error('Erro ao marcar read:', err);
                return reply.status(500).send({ message: 'Erro interno' });
            }
        }));
        // Marcar uma notificação como não-lida
        app.put('/notifications/:id/unread', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                yield firebaseConfig_1.default.collection('notifications').doc(id).update({ read: false });
                return reply.send({ ok: true });
            }
            catch (err) {
                console.error('Erro ao marcar unread:', err);
                return reply.status(500).send({ message: 'Erro interno' });
            }
        }));
        // Marcar todas como lidas
        app.put('/notifications/user/:userId/readAll', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.params;
            try {
                const snap = yield firebaseConfig_1.default
                    .collection('notifications')
                    .where('userId', '==', userId)
                    .where('read', '==', false)
                    .get();
                const batch = firebaseConfig_1.default.batch();
                snap.docs.forEach(d => batch.update(d.ref, { read: true }));
                yield batch.commit();
                return reply.send({ ok: true });
            }
            catch (err) {
                console.error('Erro ao readAll:', err);
                return reply.status(500).send({ message: 'Erro interno' });
            }
        }));
    });
}
