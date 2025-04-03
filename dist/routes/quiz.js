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
// ---------------------
// Rotas do Quiz
// ---------------------
function quizRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para responder o quiz (usuário responde e pontuação é calculada)
        app.post('/quiz/responder', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, respostas } = req.body;
            if (!usuarioId || !respostas || !Array.isArray(respostas)) {
                return reply.status(400).send({ message: 'Dados incompletos ou inválidos.' });
            }
            try {
                let score = 0;
                // Calcula a pontuação com base nas respostas corretas
                for (let resposta of respostas) {
                    if (resposta.correta) {
                        score++;
                    }
                }
                // Salva a pontuação do usuário no Firestore
                yield firebaseConfig_1.default.collection('pontuacoes').add({
                    usuarioId,
                    score,
                    data: new Date(),
                });
                return reply.send({ message: 'Quiz respondido com sucesso.', score });
            }
            catch (error) {
                console.error("Erro ao responder quiz:", error);
                return reply.status(500).send({ message: 'Erro ao responder quiz.' });
            }
        }));
        // ---------------------
        // Rotas para gerenciamento de perguntas do quiz (para o admin)
        // ---------------------
        // Criar uma nova pergunta de quiz
        app.post('/quiz/perguntas', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { categoria, pergunta, opcoes, respostaCorreta } = req.body;
            if (!categoria || !pergunta || !opcoes || opcoes.length === 0 || respostaCorreta === undefined) {
                return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
            }
            try {
                const newQuestion = yield firebaseConfig_1.default.collection('quizPerguntas').add({
                    categoria,
                    pergunta,
                    opcoes,
                    respostaCorreta,
                    dataCriacao: new Date(),
                });
                return reply.status(201).send({ message: 'Pergunta criada com sucesso.', id: newQuestion.id });
            }
            catch (error) {
                console.error("Erro ao criar pergunta:", error);
                return reply.status(500).send({ message: 'Erro ao criar pergunta.' });
            }
        }));
        // Listar perguntas de quiz (opcionalmente filtradas por categoria)
        app.get('/quiz/perguntas', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { categoria } = req.query;
            try {
                // Declaramos a variável como Query
                let query = firebaseConfig_1.default.collection('quizPerguntas');
                // Se a categoria estiver definida, aplicamos o filtro
                if (categoria) {
                    query = query.where("categoria", "==", categoria);
                }
                const snapshot = yield query.get();
                if (snapshot.empty) {
                    return reply.send([]);
                }
                const questions = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.send(questions);
            }
            catch (error) {
                console.error("Erro ao listar perguntas:", error);
                return reply.status(500).send({ message: 'Erro ao listar perguntas.' });
            }
        }));
        // Atualizar uma pergunta de quiz
        app.put('/quiz/perguntas/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const updates = req.body;
            try {
                const questionRef = firebaseConfig_1.default.collection('quizPerguntas').doc(id);
                const doc = yield questionRef.get();
                if (!doc.exists) {
                    return reply.status(404).send({ message: 'Pergunta não encontrada.' });
                }
                yield questionRef.update(Object.assign({}, updates));
                return reply.send({ message: 'Pergunta atualizada com sucesso.' });
            }
            catch (error) {
                console.error("Erro ao atualizar pergunta:", error);
                return reply.status(500).send({ message: 'Erro ao atualizar pergunta.' });
            }
        }));
        // Deletar uma pergunta de quiz
        app.delete('/quiz/perguntas/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!id) {
                    return reply.status(400).send({ message: "ID da pergunta é obrigatório." });
                }
                const questionRef = firebaseConfig_1.default.collection('quizPerguntas').doc(id);
                const doc = yield questionRef.get();
                if (!doc.exists) {
                    return reply.status(404).send({ message: 'Pergunta não encontrada.' });
                }
                yield questionRef.delete();
                return reply.send({ message: 'Pergunta deletada com sucesso.' });
            }
            catch (error) {
                console.error("Erro ao deletar pergunta:", error);
                return reply.status(500).send({ message: 'Erro interno ao deletar pergunta.' });
            }
        }));
    });
}
