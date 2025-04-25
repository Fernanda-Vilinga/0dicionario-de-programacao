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
exports.sendPushNotification = sendPushNotification;
/* src/utils/pushService.ts */
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
/**
 * Envia uma notificação push para o usuário especificado.
 * Busca o token armazenado na coleção 'tokens'.
 * @param usuarioId  ID do usuário no Firestore
 * @param title      Título da notificação
 * @param body       Corpo da notificação
 * @param data       Dados extras (payload) opcionais
 */
function sendPushNotification(usuarioId_1, title_1, body_1) {
    return __awaiter(this, arguments, void 0, function* (usuarioId, title, body, data = {}) {
        try {
            // Recupera o token do usuário
            const tokenDoc = yield firebaseConfig_1.default.collection('tokens').doc(usuarioId).get();
            if (!tokenDoc.exists) {
                console.warn(`Nenhum token encontrado para usuário ${usuarioId}`);
                return;
            }
            const { token } = tokenDoc.data();
            // Envia notificação via Firebase Admin
            yield firebase_admin_1.default.messaging().send({
                token,
                notification: { title, body },
                data
            });
        }
        catch (error) {
            console.error(`Erro ao enviar push para ${usuarioId}:`, error);
        }
    });
}
