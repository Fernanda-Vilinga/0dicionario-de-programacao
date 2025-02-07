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
exports.default = historyRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function historyRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.get('/historico/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const historicoSnapshot = yield firebaseConfig_1.default.collection('historico').where('usuarioId', '==', id).get();
                const historico = historicoSnapshot.docs.map(doc => doc.data());
                return reply.send(historico);
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao buscar histórico' });
            }
        }));
    });
}
