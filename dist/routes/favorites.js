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
exports.default = favoriteRoutes;
const firestore_1 = require("firebase-admin/firestore");
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
function favoriteRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Adicionar favorito
        app.post('/favoritos', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, tipo, id } = req.body;
            try {
                const userRef = firebaseConfig_1.default.collection('usuarios').doc(usuarioId);
                const userDoc = yield userRef.get();
                if (!userDoc.exists) {
                    return reply.status(404).send({ message: 'Usuário não encontrado' });
                }
                // Extraímos o nome do usuário para mensagens mais naturais
                const userData = userDoc.data();
                const nomeUsuario = (userData === null || userData === void 0 ? void 0 : userData.nome) || 'O usuário';
                const campo = tipo === 'termo' ? 'favoritosTermos' : 'favoritosAnotacoes';
                const subcolecao = tipo === 'termo' ? 'favoritosTermos' : 'favoritosAnotacoes';
                // Atualiza o array no doc do usuário
                yield userRef.update({
                    [campo]: firestore_1.FieldValue.arrayUnion(id),
                });
                // Cria persistência na subcoleção
                yield userRef.collection(subcolecao).doc(id).set({
                    data: new Date().toISOString(),
                });
                // Registra atividade de adicionar favorito com mensagem amigável (sem exibir ID)
                const descricao = `${nomeUsuario} adicionou um ${tipo === 'termo' ? 'termo' : 'a anotação'} aos favoritos.`;
                const acao = "Adicionar Favorito";
                yield registrarAtividade(usuarioId, descricao, acao);
                return reply.send({ message: `${tipo === 'termo' ? 'Termo' : 'Anotação'} adicionada aos favoritos com sucesso` });
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao adicionar favorito', error });
            }
        }));
        // Remover favorito
        app.delete('/favoritos', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, tipo, id } = req.body;
            try {
                const userRef = firebaseConfig_1.default.collection('usuarios').doc(usuarioId);
                const userDoc = yield userRef.get();
                if (!userDoc.exists) {
                    return reply.status(404).send({ message: 'Usuário não encontrado' });
                }
                const userData = userDoc.data();
                const nomeUsuario = (userData === null || userData === void 0 ? void 0 : userData.nome) || 'O usuário';
                const campo = tipo === 'termo' ? 'favoritosTermos' : 'favoritosAnotacoes';
                const subcolecao = tipo === 'termo' ? 'favoritosTermos' : 'favoritosAnotacoes';
                // Remove do array do usuário
                yield userRef.update({
                    [campo]: firestore_1.FieldValue.arrayRemove(id),
                });
                // Remove da subcoleção
                yield userRef.collection(subcolecao).doc(id).delete();
                // Registra atividade de remoção de favorito com mensagem amigável
                const descricao = `${nomeUsuario} removeu um ${tipo === 'termo' ? 'termo' : 'a anotação'} dos favoritos.`;
                const acao = "Remover Favorito";
                yield registrarAtividade(usuarioId, descricao, acao);
                return reply.send({ message: `${tipo === 'termo' ? 'Termo' : 'Anotação'} removido dos favoritos com sucesso` });
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao remover favorito', error });
            }
        }));
        // Listar favoritos
        app.get('/favoritos/:usuarioId', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId } = req.params;
            try {
                const userRef = firebaseConfig_1.default.collection('usuarios').doc(usuarioId);
                const userDoc = yield userRef.get();
                if (!userDoc.exists) {
                    return reply.status(404).send({ message: 'Usuário não encontrado' });
                }
                // Subcoleções
                const termosSnap = yield userRef.collection('favoritosTermos').get();
                const anotacoesSnap = yield userRef.collection('favoritosAnotacoes').get();
                const termos = termosSnap.docs.map(doc => doc.id);
                const anotacoes = anotacoesSnap.docs.map(doc => doc.id);
                return reply.send({
                    termos,
                    anotacoes,
                });
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao listar favoritos', error });
            }
        }));
    });
}
