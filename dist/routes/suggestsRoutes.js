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
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function suggestsRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // 🔹 Enviar sugestão
        app.post('/sugestoes', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, categoria, descricao, status } = request.body;
            if (!usuarioId || !categoria || !descricao) {
                return reply.status(400).send({ message: 'Dados inválidos' });
            }
            try {
                const novaSugestao = {
                    usuarioId,
                    categoria,
                    descricao,
                    status: status || 'pendente',
                    data: new Date().toISOString(),
                };
                const docRef = yield firebaseConfig_1.default.collection('sugestoes').add(novaSugestao);
                return reply.status(201).send({ message: 'Sugestão recebida', id: docRef.id });
            }
            catch (error) {
                console.error('Erro ao enviar sugestão:', error);
                return reply.status(500).send({ message: 'Erro no servidor' });
            }
        }));
        // 🔹 Listar sugestões
        app.get('/sugestoes', (_, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const snapshot = yield firebaseConfig_1.default.collection('sugestoes').get();
                const sugestoes = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.status(200).send(sugestoes);
            }
            catch (error) {
                console.error('Erro ao buscar sugestões:', error);
                return reply.status(500).send({ message: 'Erro ao buscar sugestões' });
            }
        }));
        // 🔹 Atualizar status da sugestão
        app.put('/sugestoes/:id', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const { status } = request.body;
            if (!status) {
                return reply.status(400).send({ message: 'Status não informado' });
            }
            try {
                const docRef = firebaseConfig_1.default.collection('sugestoes').doc(id);
                yield docRef.update({ status });
                return reply.status(200).send({ message: 'Status da sugestão atualizado' });
            }
            catch (error) {
                console.error('Erro ao atualizar status:', error);
                return reply.status(500).send({ message: 'Erro ao atualizar status' });
            }
        }));
    });
}
exports.default = suggestsRoutes;
