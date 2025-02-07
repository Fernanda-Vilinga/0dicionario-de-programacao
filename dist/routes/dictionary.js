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
        // Rota para pesquisar termos
        app.get('/dicionario/termos', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { termo } = req.query;
            if (!termo) {
                return reply.status(400).send({ message: 'Termo não fornecido.' });
            }
            try {
                const termRef = firebaseConfig_1.default.collection('termos').where('termo', '>=', termo).where('termo', '<=', termo + '\uf8ff');
                const termSnapshot = yield termRef.get();
                if (termSnapshot.empty) {
                    return reply.status(404).send({ message: 'Termo não encontrado.' });
                }
                const termos = termSnapshot.docs.map(doc => doc.data());
                return reply.send(termos);
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao buscar termo' });
            }
        }));
        // Rota para o Admin adicionar um termo
        app.post('/dicionario/termo', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { termo, definicao, exemplos, linguagem } = req.body;
            if (!termo || !definicao) {
                return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
            }
            try {
                const newTerm = yield firebaseConfig_1.default.collection('termos').add({
                    termo,
                    definicao,
                    exemplos,
                    linguagem,
                });
                return reply.status(201).send({ message: 'Termo adicionado com sucesso.', id: newTerm.id });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao adicionar termo.' });
            }
        }));
    });
}
