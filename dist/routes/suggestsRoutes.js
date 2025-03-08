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
const axios_1 = __importDefault(require("axios"));
// Definição das credenciais da API Hugging Face (use variáveis de ambiente para segurança)
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/seu-modelo-aqui';
const HUGGING_FACE_API_KEY = 'seu-token-aqui'; // Armazene em variáveis de ambiente!
function suggestionsRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // 📌 Rota para obter sugestões da Hugging Face e salvar no Firestore
        app.post('/sugestoes', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, sugestao } = req.body;
            if (!usuarioId || !sugestao) {
                return reply.status(400).send({ message: 'Usuário e sugestão são obrigatórios.' });
            }
            try {
                // Chamada à API Hugging Face para obter sugestões
                const response = yield axios_1.default.post(HUGGING_FACE_API_URL, { inputs: sugestao }, {
                    headers: {
                        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                });
                const sugestoes = response.data; // Ajuste conforme o retorno da API
                // Salvando sugestões no Firestore
                const batch = firebaseConfig_1.default.batch();
                sugestoes.forEach((termo) => {
                    const ref = firebaseConfig_1.default.collection('sugestoes').doc();
                    batch.set(ref, {
                        usuarioId,
                        termo: termo.termo, // Ajuste conforme resposta da API
                        definicao: termo.definicao || '',
                        exemplos: termo.exemplos || [],
                        linguagem: termo.linguagem || 'Geral',
                        dataCriacao: new Date(),
                    });
                });
                yield batch.commit();
                return reply.status(201).send({ message: 'Sugestões enviadas e salvas com sucesso' });
            }
            catch (error) {
                console.error('Erro ao buscar sugestões:', error);
                return reply.status(500).send({ message: 'Erro ao buscar sugestões' });
            }
        }));
        // 📌 Rota para aceitar uma sugestão e movê-la para a coleção de termos
        app.post('/sugestoes/aceitar/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const sugestaoRef = firebaseConfig_1.default.collection('sugestoes').doc(id);
                const sugestaoDoc = yield sugestaoRef.get();
                if (!sugestaoDoc.exists) {
                    return reply.status(404).send({ message: 'Sugestão não encontrada' });
                }
                const sugestao = sugestaoDoc.data();
                // Movendo a sugestão para a coleção 'termos'
                yield firebaseConfig_1.default.collection('termos').doc(id).set({
                    termo: sugestao === null || sugestao === void 0 ? void 0 : sugestao.termo,
                    definicao: sugestao === null || sugestao === void 0 ? void 0 : sugestao.definicao,
                    exemplos: (sugestao === null || sugestao === void 0 ? void 0 : sugestao.exemplos) || [],
                    linguagem: (sugestao === null || sugestao === void 0 ? void 0 : sugestao.linguagem) || 'Geral',
                    dataCriacao: new Date(),
                });
                // Removendo a sugestão da coleção de sugestões
                yield sugestaoRef.delete();
                return reply.status(200).send({ message: 'Sugestão aceita e movida para o dicionário' });
            }
            catch (error) {
                console.error('Erro ao aceitar sugestão:', error);
                return reply.status(500).send({ message: 'Erro ao aceitar sugestão' });
            }
        }));
    });
}
