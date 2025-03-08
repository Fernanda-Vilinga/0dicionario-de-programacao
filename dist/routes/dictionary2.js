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
exports.default = dicionarioRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
require("dotenv/config");
const axios_1 = __importDefault(require("axios"));
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`;
if (!GEMINI_API_KEY) {
    throw new Error("🚨 A chave da API do Gemini não foi encontrada. Verifique o arquivo .env!");
}
function dicionarioRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // 🔍 Buscar termo no dicionário
        app.get('/dicionario/termos', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { termo } = req.query;
            if (!termo) {
                return reply.status(400).send({ message: 'Termo não fornecido.' });
            }
            try {
                const termRef = firebaseConfig_1.default.collection('termos').where('termo', '>=', termo).where('termo', '<=', termo + '\uf8ff');
                const termSnapshot = yield termRef.get();
                if (termSnapshot.empty) {
                    return reply.status(404).send({ message: 'Nenhum termo encontrado.' });
                }
                const termos = termSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.send(termos);
            }
            catch (error) {
                console.error("Erro ao buscar termo:", error);
                return reply.status(500).send({ message: 'Erro ao buscar termo' });
            }
        }));
        // ✅ Adicionar termo manualmente (Admin)
        app.post('/dicionario/termo', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { termo, definicao, exemplos, linguagem } = req.body;
            if (!termo || !definicao) {
                return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
            }
            try {
                const newTerm = yield firebaseConfig_1.default.collection('termos').add({
                    termo,
                    definicao,
                    exemplos: exemplos || [],
                    linguagem: linguagem || 'Geral',
                });
                return reply.status(201).send({ message: 'Termo adicionado com sucesso.', id: newTerm.id });
            }
            catch (error) {
                console.error("Erro ao adicionar termo:", error);
                return reply.status(500).send({ message: 'Erro ao adicionar termo.' });
            }
        }));
        // 🔄 Usuário sugere um novo termo
        app.post('/dicionario/sugerir', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { termo, definicao, sugeridoPor } = req.body;
            if (!termo || !definicao || !sugeridoPor) {
                return reply.status(400).send({ message: 'Todos os campos são obrigatórios.' });
            }
            try {
                // Verificar se já existe um termo igual no dicionário
                const existingTerm = yield firebaseConfig_1.default.collection('termos').where('termo', '==', termo).get();
                if (!existingTerm.empty) {
                    return reply.status(400).send({ message: 'Esse termo já existe no dicionário.' });
                }
                // Salvar sugestão
                yield firebaseConfig_1.default.collection('sugestoes').add({
                    termo,
                    definicao,
                    sugeridoPor,
                    status: 'pendente'
                });
                return reply.status(201).send({ message: 'Sugestão enviada para análise.' });
            }
            catch (error) {
                console.error("Erro ao sugerir termo:", error);
                return reply.status(500).send({ message: 'Erro ao sugerir termo.' });
            }
        }));
        // 🚀 Admin revisa sugestões e aprova ou rejeita
        app.put('/dicionario/sugestoes/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { status } = req.body;
            if (!['aprovado', 'rejeitado'].includes(status)) {
                return reply.status(400).send({ message: 'Status inválido.' });
            }
            try {
                const docRef = firebaseConfig_1.default.collection('sugestoes').doc(id);
                const docSnap = yield docRef.get();
                if (!docSnap.exists) {
                    return reply.status(404).send({ message: 'Sugestão não encontrada.' });
                }
                // Atualizar status
                yield docRef.update({ status });
                // Se for aprovado, mover para a coleção principal
                if (status === 'aprovado') {
                    const data = docSnap.data();
                    yield firebaseConfig_1.default.collection('termos').add({
                        termo: data.termo,
                        definicao: data.definicao,
                    });
                }
                return reply.send({ message: `Sugestão ${status} com sucesso.` });
            }
            catch (error) {
                console.error("Erro ao revisar sugestão:", error);
                return reply.status(500).send({ message: 'Erro ao revisar sugestão.' });
            }
        }));
        // 🤖 Admin gera termos via IA (Gemini)
        app.post('/dicionario/gerar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { prompt } = req.body;
            if (!prompt) {
                return reply.status(400).send({ message: 'Prompt não fornecido.' });
            }
            try {
                const response = yield axios_1.default.post(GEMINI_API_URL, {
                    prompt,
                    max_tokens: 200,
                    temperature: 0.7,
                });
                const generatedText = (_c = (_b = (_a = response.data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.text) === null || _c === void 0 ? void 0 : _c.trim();
                if (!generatedText) {
                    return reply.status(500).send({ message: 'A IA não gerou um termo válido.' });
                }
                // Salvar no Firestore como sugestão gerada pela IA
                const newSuggestion = yield firebaseConfig_1.default.collection('sugestoes_ia').add({
                    termo: generatedText,
                    definicao: 'Definição gerada automaticamente pela IA.',
                    status: 'pendente'
                });
                return reply.status(201).send({ message: 'Sugestão gerada com sucesso.', id: newSuggestion.id });
            }
            catch (error) {
                console.error("Erro ao gerar termo com IA:", error);
                return reply.status(500).send({ message: 'Erro ao gerar termo.' });
            }
        }));
    });
}
