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
exports.default = mentoriaRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function mentoriaRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para agendar mentoria
        app.post('/mentoria/agendar', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, mentorId, data, horario } = req.body;
            if (!usuarioId || !mentorId || !data || !horario) {
                return reply.status(400).send({ message: 'Preencha todos os campos obrigatórios.' });
            }
            try {
                const dataHoraMentoria = new Date(`${data}T${horario}:00Z`);
                const agora = new Date();
                if (dataHoraMentoria <= agora) {
                    return reply.status(400).send({ message: 'A mentoria deve ser agendada para uma data futura.' });
                }
                const mentoriasExistentes = yield firebaseConfig_1.default
                    .collection('sessaoMentoria')
                    .where('mentorId', '==', mentorId)
                    .where('data', '==', data)
                    .where('horario', '==', horario)
                    .get();
                if (!mentoriasExistentes.empty) {
                    return reply.status(400).send({ message: 'O mentor já tem uma sessão agendada nesse horário.' });
                }
                const newSession = yield firebaseConfig_1.default.collection('sessaoMentoria').add({
                    usuarioId,
                    mentorId,
                    data,
                    horario,
                    status: 'agendado', // Status inicial
                    dataCriacao: new Date(),
                });
                return reply.status(201).send({ message: 'Mentoria agendada com sucesso.', id: newSession.id });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao agendar mentoria.' });
            }
        }));
        // Rota para aceitar uma mentoria (mentor)
        app.patch('/mentoria/aceitar/:sessaoId', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { sessaoId } = req.params;
            try {
                const sessaoRef = firebaseConfig_1.default.collection('sessaoMentoria').doc(sessaoId);
                const sessao = yield sessaoRef.get();
                if (!sessao.exists) {
                    return reply.status(404).send({ message: 'Sessão de mentoria não encontrada.' });
                }
                yield sessaoRef.update({ status: 'aceita' });
                return reply.send({ message: 'Mentoria aceita com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao aceitar mentoria.' });
            }
        }));
    });
}
