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
exports.default = notasRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function notasRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Adicionar CORS para permitir requisições do frontend
        app.addHook('onRequest', (req, reply, done) => {
            reply.header('Access-Control-Allow-Origin', '*');
            reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            reply.header('Access-Control-Allow-Headers', 'Content-Type');
            done();
        });
        // Criar uma nova anotação
        app.post('/notas', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            console.log('Recebendo requisição POST em /notas:', req.body);
            const { usuarioId, conteudo, tags } = req.body;
            if (!usuarioId || !conteudo) {
                console.warn('Erro: Campos obrigatórios ausentes.');
                return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
            }
            try {
                const newNote = yield firebaseConfig_1.default.collection('notas').add({
                    usuarioId,
                    conteudo,
                    tags,
                    dataCriacao: new Date(),
                });
                console.log('Nota criada com sucesso:', newNote.id);
                return reply.status(201).send({ message: 'Nota salva com sucesso.', id: newNote.id });
            }
            catch (error) {
                console.error('Erro ao salvar nota:', error);
                return reply.status(500).send({ message: 'Erro ao salvar anotação.', error: String(error) });
            }
        }));
        // Listar todas as anotações de um usuário
        app.get('/notas', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            console.log('Recebendo requisição GET em /notas com query:', req.query);
            const { usuarioId } = req.query;
            if (!usuarioId) {
                console.warn('Erro: Usuário não informado.');
                return reply.status(400).send({ message: 'Usuário não informado.' });
            }
            try {
                const snapshot = yield firebaseConfig_1.default.collection('notas').where('usuarioId', '==', usuarioId).get();
                if (snapshot.empty) {
                    console.warn(`Nenhuma nota encontrada para o usuário: ${usuarioId}`);
                    return reply.status(404).send({ message: 'Nenhuma nota encontrada.' });
                }
                const notas = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                console.log(`Notas encontradas para o usuário ${usuarioId}:`, notas);
                return reply.status(200).send(notas);
            }
            catch (error) {
                console.error('Erro ao buscar notas:', error);
                return reply.status(500).send({ message: 'Erro ao buscar notas.', error: String(error) });
            }
        }));
        // Atualizar uma anotação
        app.put('/notas/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            console.log('Recebendo requisição PUT em /notas:', req.params, req.body);
            const { id } = req.params;
            const { conteudo, tags } = req.body;
            try {
                const notaRef = firebaseConfig_1.default.collection('notas').doc(id);
                const notaDoc = yield notaRef.get();
                if (!notaDoc.exists) {
                    console.warn(`Nota com ID ${id} não encontrada.`);
                    return reply.status(404).send({ message: 'Nota não encontrada.' });
                }
                yield notaRef.update(Object.assign(Object.assign({}, (conteudo && { conteudo })), (tags && { tags })));
                console.log(`Nota ${id} atualizada com sucesso.`);
                return reply.status(200).send({ message: 'Nota atualizada com sucesso.' });
            }
            catch (error) {
                console.error('Erro ao atualizar nota:', error);
                return reply.status(500).send({ message: 'Erro ao atualizar nota.', error: String(error) });
            }
        }));
        // Deletar uma anotação
        app.delete('/notas/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            console.log('Recebendo requisição DELETE em /notas:', req.params);
            const { id } = req.params;
            try {
                const notaRef = firebaseConfig_1.default.collection('notas').doc(id);
                const notaDoc = yield notaRef.get();
                if (!notaDoc.exists) {
                    console.warn(`Nota com ID ${id} não encontrada.`);
                    return reply.status(404).send({ message: 'Nota não encontrada.' });
                }
                yield notaRef.delete();
                console.log(`Nota ${id} removida com sucesso.`);
                return reply.status(200).send({ message: 'Nota removida com sucesso.' });
            }
            catch (error) {
                console.error('Erro ao deletar nota:', error);
                return reply.status(500).send({ message: 'Erro ao deletar nota.', error: String(error) });
            }
        }));
    });
}
