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
exports.default = suggestionsRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function suggestionsRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.post('/sugestoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, sugestao } = req.body;
            if (!usuarioId || !sugestao) {
                return reply.status(400).send({ message: 'Usuário e sugestão são obrigatórios.' });
            }
            try {
                yield firebaseConfig_1.default.collection('sugestoes').add({
                    usuarioId,
                    sugestao,
                    dataCriacao: new Date(),
                });
                return reply.status(201).send({ message: 'Sugestão enviada com sucesso' });
            }
            catch (error) {
                console.error('Erro ao enviar sugestão:', error);
                return reply.status(500).send({ message: 'Erro ao enviar sugestão' });
            }
        }));
    });
}
