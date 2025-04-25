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
exports.default = contactRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
// (Opcional) Se desejar registrar atividade, use uma função similar à que usamos nas outras rotas:
// function registrarAtividade(userId: string, descricao: string, acao: string) {
//   db.collection('atividades').add({
//     userId,
//     description: descricao,
//     action: acao,
//     createdAt: new Date(),
//   }).catch(error => {
//     console.error('Erro ao registrar atividade:', error);
//   });
// }
function contactRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para buscar os contatos do usuário informado
        app.get('/contatos/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { lastContactId, limit = 10 } = req.query;
            try {
                const userDoc = yield firebaseConfig_1.default.collection('usuarios').doc(id).get();
                if (!userDoc.exists) {
                    return reply.status(404).send({ message: 'Usuário não encontrado' });
                }
                const loggedUser = userDoc.data();
                const targetType = loggedUser.tipo_de_usuario === 'MENTOR' ? 'USER' : 'MENTOR';
                // Consulta com startAfter
                let query = firebaseConfig_1.default.collection('usuarios')
                    .where('tipo_de_usuario', '==', targetType)
                    .limit(limit);
                if (lastContactId) {
                    const lastContactDoc = yield firebaseConfig_1.default.collection('usuarios').doc(lastContactId).get();
                    if (lastContactDoc.exists) {
                        query = query.startAfter(lastContactDoc);
                    }
                }
                const querySnapshot = yield query.get();
                if (querySnapshot.empty) {
                    return reply.status(404).send({ message: 'Nenhum contato encontrado.' });
                }
                const contatos = querySnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return reply.send(contatos);
            }
            catch (error) {
                console.error('Erro ao buscar contatos:', error);
                return reply.status(500).send({ message: 'Erro interno ao buscar contatos.', error });
            }
        }));
    });
}
