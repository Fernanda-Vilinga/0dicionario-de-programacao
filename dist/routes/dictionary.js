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
exports.default = dicionarioRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
// Função auxiliar para registrar atividade
function registrarAtividade(userId, descricao, acao) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield firebaseConfig_1.default.collection('atividades').add({
                userId,
                description: descricao,
                action: acao,
                createdAt: new Date(), // Usamos a data atual
            });
        }
        catch (error) {
            console.error('Erro ao registrar atividade:', error);
        }
    });
}
function dicionarioRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // 🔍 Rota para buscar um termo específico (prefix match + case sensitive)
        app.get('/dicionario/termos', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { termo } = req.query;
            if (!termo) {
                return reply.status(400).send({ message: 'Termo não fornecido.' });
            }
            try {
                const termoLower = termo.toLowerCase();
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
        // 🔍 Rota para busca simples (substring search)
        app.get('/dicionario/termos/simples', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            let { termo } = req.query;
            if (!termo) {
                return reply.status(400).send({ message: 'Termo não fornecido.' });
            }
            termo = termo.toLowerCase().trim();
            try {
                const termSnapshot = yield firebaseConfig_1.default.collection('termos').get();
                if (termSnapshot.empty) {
                    return reply.status(404).send({ message: 'Nenhum termo encontrado.' });
                }
                let termos = termSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                const resultado = termos.filter(t => t.termo_lower && t.termo_lower.includes(termo));
                if (resultado.length === 0) {
                    return reply.status(404).send({ message: 'Nenhum termo encontrado.' });
                }
                return reply.send(resultado);
            }
            catch (error) {
                console.error("Erro ao buscar termo simples:", error);
                return reply.status(500).send({ message: 'Erro ao buscar termo simples' });
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
        // ✅ Rota para adicionar um termo e registrar a atividade
        app.post('/dicionario/termo', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { termo, definicao, exemplos, linguagem, categoria } = req.body;
            if (!termo || !definicao) {
                return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
            }
            try {
                // Adiciona o termo na coleção
                const novoTermoRef = yield firebaseConfig_1.default.collection('termos').add({
                    termo,
                    termo_lower: termo.toLowerCase(),
                    definicao,
                    exemplos: exemplos || [],
                    linguagem: linguagem || 'Geral',
                    categoria: categoria || 'Sem categoria',
                });
                // Define o userId para registro de atividade (utilizando header x-user-id, se existir)
                const userId = req.headers['x-user-id'] || 'sistema';
                // Mensagem de atividade mais natural
                const descricao = `O termo '${termo}' foi adicionado com sucesso ao dicionário.`;
                const acao = "Adicionar termo";
                // Registra a atividade
                yield registrarAtividade(userId, descricao, acao);
                return reply.status(201).send({ message: 'Termo adicionado com sucesso.', id: novoTermoRef.id });
            }
            catch (error) {
                console.error("Erro ao adicionar termo:", error);
                return reply.status(500).send({ message: 'Erro ao adicionar termo.' });
            }
        }));
        // 🔍 Rota para buscar um termo por ID
        app.get('/dicionario/termos/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const doc = yield firebaseConfig_1.default.collection('termos').doc(id).get();
                if (!doc.exists) {
                    return reply.status(404).send({ message: 'Termo não encontrado.' });
                }
                const termoEncontrado = Object.assign({ id: doc.id }, doc.data());
                return reply.send(termoEncontrado);
            }
            catch (error) {
                console.error("Erro ao buscar termo por ID:", error);
                return reply.status(500).send({ message: 'Erro ao buscar termo por ID.' });
            }
        }));
    });
}
