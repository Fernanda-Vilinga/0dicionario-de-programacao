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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = sendPushNotification;
function sendPushNotification(expoPushToken_1, title_1, body_1) {
    return __awaiter(this, arguments, void 0, function* (expoPushToken, title, body, data = {}) {
        const notificationMessage = {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data, // Dados extras, como o ID da operação ou ação para navegação
        };
        try {
            const response = yield fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(notificationMessage),
            });
            const resData = yield response.json();
            console.log("Notificação enviada:", resData);
            return resData;
        }
        catch (error) {
            console.error("Erro ao enviar notificação:", error);
            throw error;
        }
    });
}
