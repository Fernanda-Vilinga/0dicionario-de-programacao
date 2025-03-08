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
function dicionarioRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // 🔍 Rota para buscar um termo específico (prefix match + case sensitive)
        app.get('/dicionario/termos', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            let { termo } = req.query;
            if (!termo) {
                return reply.status(400).send({ message: 'Termo não fornecido.' });
            }
            try {
                const termoLower = termo.toLowerCase();
                // 🔥 Agora usamos `array-contains` para buscar termos começando com o que foi digitado
                const termRef = firebaseConfig_1.default.collection('termos').where('termo_array', 'array-contains', termoLower);
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
        // 📌 Rota para listar todos os termos cadastrados
        app.get('/dicionario/todos', (_, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const termRef = firebaseConfig_1.default.collection('termos');
                const termSnapshot = yield termRef.get();
                if (termSnapshot.empty) {
                    return reply.send([]);
                }
                const termos = termSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.send(termos);
            }
            catch (error) {
                console.error("Erro ao buscar todos os termos:", error);
                return reply.status(500).send({ message: 'Erro ao buscar os termos' });
            }
        }));
        // ✅ Rota para adicionar um termo
        app.post('/dicionario/termo', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { termo, definicao, exemplos, linguagem } = req.body;
            if (!termo || !definicao) {
                return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
            }
            try {
                const newTerm = yield firebaseConfig_1.default.collection('termos').add({
                    termo,
                    termo_lower: termo.toLowerCase(), // Garante buscas insensíveis a maiúsculas/minúsculas
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
    });
}
