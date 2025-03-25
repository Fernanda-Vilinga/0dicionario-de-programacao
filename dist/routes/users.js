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
function contactRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Rota para buscar os contatos do usuário informado
        app.get('/contatos/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                // Buscar o usuário na coleção "usuarios"
                const userDoc = yield firebaseConfig_1.default.collection('usuarios').doc(id).get();
                if (!userDoc.exists) {
                    return reply.status(404).send({ message: 'Usuário não encontrado' });
                }
                const loggedUser = userDoc.data();
                console.log('✅ Usuário encontrado:', loggedUser);
                // Determinar o tipo oposto:
                // Se o usuário for MENTOR, buscar contatos do tipo USER
                // Se o usuário for USER, buscar contatos do tipo MENTOR
                const targetType = loggedUser.tipo_de_usuario === 'MENTOR' ? 'USER' : 'MENTOR';
                console.log(`🔎 Buscando contatos do tipo: ${targetType}`);
                // Buscar os contatos na coleção "usuarios"
                const querySnapshot = yield firebaseConfig_1.default.collection('usuarios')
                    .where('tipo_de_usuario', '==', targetType)
                    .get();
                if (querySnapshot.empty) {
                    return reply.status(404).send({ message: 'Nenhum contato encontrado.' });
                }
                const contatos = querySnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                console.log('✅ Contatos encontrados:', contatos);
                return reply.send(contatos);
            }
            catch (error) {
                console.error('❌ Erro ao buscar contatos:', error);
                return reply.status(500).send({ message: 'Erro interno ao buscar contatos.', error });
            }
        }));
    });
}
