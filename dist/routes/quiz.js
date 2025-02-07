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
exports.default = quizRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function quizRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para responder quiz
        app.post('/quiz/responder', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, respostas } = req.body;
            if (!usuarioId || !respostas || !Array.isArray(respostas)) {
                return reply.status(400).send({ message: 'Dados incompletos ou inválidos.' });
            }
            try {
                let score = 0;
                // Verificar respostas e calcular pontuação
                for (let resposta of respostas) {
                    if (resposta.correta) {
                        score++;
                    }
                }
                // Salvar pontuação do usuário
                yield firebaseConfig_1.default.collection('pontuacoes').add({
                    usuarioId,
                    score,
                    data: new Date(),
                });
                return reply.send({ message: 'Quiz respondido com sucesso.', score });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao responder quiz.' });
            }
        }));
    });
}
