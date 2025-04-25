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
exports.default = notificationRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
function notificationRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Registrar token push
        app.post('/tokens', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, token } = req.body;
            if (!usuarioId || !token) {
                return reply.status(400).send({ message: 'usuarioId e token são obrigatórios.' });
            }
            yield firebaseConfig_1.default.collection('tokens').doc(usuarioId).set({ token });
            return reply.send({ message: 'Token registrado.' });
        }));
        // Remover token no logout
        app.delete('/tokens/:usuarioId', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId } = req.params;
            yield firebaseConfig_1.default.collection('tokens').doc(usuarioId).delete();
            return reply.send({ message: 'Token removido.' });
        }));
        // Enviar notificação manual via backend
        app.post('/notificar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, title, body, data } = req.body;
            const tokenDoc = yield firebaseConfig_1.default.collection('tokens').doc(usuarioId).get();
            if (!tokenDoc.exists) {
                return reply.status(404).send({ message: 'Token não encontrado.' });
            }
            const { token } = tokenDoc.data();
            yield firebase_admin_1.default.messaging().send({
                token,
                notification: { title, body },
                data: data || {}
            });
            return reply.send({ success: true });
        }));
    });
}
