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
exports.distribuirNotificacao = distribuirNotificacao;
exports.fetchNotifications = fetchNotifications;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markNotificationAsUnread = markNotificationAsUnread;
exports.buscarUsuariosPorRole = buscarUsuariosPorRole;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
/**
 * Registra um log de atividade na coleção 'atividades'.
 */
function registrarAtividade(userId, descricao, acao) {
    return __awaiter(this, void 0, void 0, function* () {
        const timestamp = firebase_admin_1.default.firestore.Timestamp.now();
        yield firebaseConfig_1.default.collection('atividades').add({
            userId,
            description: descricao,
            action: acao,
            createdAt: timestamp
        });
    });
}
/**
 * Envia notificações para múltiplos usuários em batch.
 */
function distribuirNotificacao(recipients, type, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const batch = firebaseConfig_1.default.batch();
        const timestamp = firebase_admin_1.default.firestore.Timestamp.now();
        for (const userId of recipients) {
            const ref = firebaseConfig_1.default.collection('notifications').doc();
            batch.set(ref, {
                userId,
                type,
                message,
                createdAt: timestamp,
                read: false
            });
        }
        yield batch.commit();
    });
}
/**
 * Busca notificações de um usuário (ordenadas por data desc).
 */
function fetchNotifications(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const snap = yield firebaseConfig_1.default
            .collection('notifications')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        return snap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    });
}
/**
 * Marca todas as notificações de um usuário como lidas.
 */
function markAllNotificationsAsRead(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const snap = yield firebaseConfig_1.default
            .collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();
        const batch = firebaseConfig_1.default.batch();
        snap.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        if (!snap.empty) {
            yield batch.commit();
        }
    });
}
/**
 * Marca uma única notificação como lida.
 */
function markNotificationAsRead(id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield firebaseConfig_1.default.collection('notifications').doc(id).update({ read: true });
    });
}
/**
 * Marca uma única notificação como não lida.
 */
function markNotificationAsUnread(id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield firebaseConfig_1.default.collection('notifications').doc(id).update({ read: false });
    });
}
/**
 * Retorna lista de userIds para todos os usuários com o role especificado.
 */
function buscarUsuariosPorRole(role) {
    return __awaiter(this, void 0, void 0, function* () {
        // Firestore armazena em maiúsculo: "USER", "MENTOR", "ADMIN"
        const tipo = role.toUpperCase();
        const snap = yield firebaseConfig_1.default
            .collection('usuarios')
            .where('tipo_de_usuario', '==', tipo)
            .get();
        return snap.docs.map(doc => doc.id);
    });
}
