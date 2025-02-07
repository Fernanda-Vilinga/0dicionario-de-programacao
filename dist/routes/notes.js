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
        // Rota para salvar uma nova anotação
        app.post('/notas', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, conteudo, tags } = req.body;
            if (!usuarioId || !conteudo) {
                return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
            }
            try {
                const newNote = yield firebaseConfig_1.default.collection('notas').add({
                    usuarioId,
                    conteudo,
                    tags,
                    dataCriacao: new Date(),
                });
                return reply.status(201).send({ message: 'Nota salva com sucesso.', id: newNote.id });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao salvar anotação.' });
            }
        }));
    });
}
