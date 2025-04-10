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
exports.default = promoteMentorRoutes;
const firebaseConfig_1 = __importDefault(require("../../firebaseConfig"));
function promoteMentorRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Endpoint para promover usuário a mentor
        app.post('/auth/promovermentores', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return reply.status(400).send({ message: 'Preencha o email do usuário.' });
            }
            try {
                const userRef = firebaseConfig_1.default.collection('usuarios').where('email', '==', email).limit(1);
                const userSnapshot = yield userRef.get();
                if (userSnapshot.empty) {
                    return reply.status(404).send({ message: 'Usuário não encontrado.' });
                }
                const userData = userSnapshot.docs[0].data();
                if (userData.tipo_de_usuario === 'MENTOR') {
                    return reply.status(400).send({ message: 'Usuário já é mentor.' });
                }
                // Atualiza o usuário para MENTOR
                yield userSnapshot.docs[0].ref.update({ tipo_de_usuario: 'MENTOR' });
                // Atualiza a solicitação de promoção (caso exista) para "aprovado"
                const solicitacaoRef = firebaseConfig_1.default
                    .collection('solicitacoes_promocao')
                    .where('email', '==', email)
                    .where('status', '==', 'pendente')
                    .limit(1);
                const solicitacaoSnapshot = yield solicitacaoRef.get();
                if (!solicitacaoSnapshot.empty) {
                    solicitacaoSnapshot.forEach((doc) => __awaiter(this, void 0, void 0, function* () {
                        yield doc.ref.update({ status: 'aprovado' });
                    }));
                }
                return reply.status(200).send({ message: 'Usuário promovido a mentor com sucesso!' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao promover usuário.' });
            }
        }));
        // Endpoint para promover mentor a admin
        app.post('/auth/promoveradmin', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return reply.status(400).send({ message: 'Preencha o email do usuário.' });
            }
            try {
                const userRef = firebaseConfig_1.default.collection('usuarios').where('email', '==', email).limit(1);
                const userSnapshot = yield userRef.get();
                if (userSnapshot.empty) {
                    return reply.status(404).send({ message: 'Usuário não encontrado.' });
                }
                const userDoc = userSnapshot.docs[0];
                const userData = userDoc.data();
                if (userData.tipo_de_usuario === 'ADMIN') {
                    return reply.status(400).send({ message: 'Usuário já é ADMIN.' });
                }
                if (userData.tipo_de_usuario !== 'MENTOR') {
                    return reply.status(400).send({ message: 'Apenas mentores podem ser promovidos a admin.' });
                }
                // Atualiza o usuário para ADMIN
                yield userDoc.ref.update({ tipo_de_usuario: 'ADMIN' });
                // Atualiza a solicitação de promoção (caso exista) para "aprovado"
                const solicitacaoRef = firebaseConfig_1.default
                    .collection('solicitacoes_promocao')
                    .where('email', '==', email)
                    .where('status', '==', 'pendente')
                    .limit(1);
                const solicitacaoSnapshot = yield solicitacaoRef.get();
                if (!solicitacaoSnapshot.empty) {
                    solicitacaoSnapshot.forEach((doc) => __awaiter(this, void 0, void 0, function* () {
                        yield doc.ref.update({ status: 'aprovado' });
                    }));
                }
                return reply.status(200).send({ message: 'Usuário promovido a ADMIN com sucesso!' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao promover usuário a ADMIN.' });
            }
        }));
        // Endpoint para remover um usuário
        app.delete('/auth/removerusuario', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return reply.status(400).send({ message: 'Informe o email do usuário.' });
            }
            try {
                const userRef = firebaseConfig_1.default.collection('usuarios').where('email', '==', email).limit(1);
                const userSnapshot = yield userRef.get();
                if (userSnapshot.empty) {
                    return reply.status(404).send({ message: 'Usuário não encontrado.' });
                }
                yield userSnapshot.docs[0].ref.delete();
                return reply.status(200).send({ message: 'Usuário removido com sucesso.' });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao remover usuário.' });
            }
        }));
        // Endpoint para buscar todos os usuários com foto de perfil, email e nome
        app.get('/auth/usuarios', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const usersSnapshot = yield firebaseConfig_1.default.collection('usuarios').get();
                const users = usersSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        nome: data.nome || 'Sem nome',
                        email: data.email || '',
                        profileImage: data.profileImage || null,
                        tipo_de_usuario: data.tipo_de_usuario || 'USER',
                    };
                });
                return reply.send(users);
            }
            catch (error) {
                console.error('Erro ao buscar usuários:', error);
                return reply.status(500).send({ message: 'Erro ao buscar usuários.' });
            }
        }));
        // Endpoint para solicitar promoção
        // Endpoint para solicitar promoção
        app.post('/auth/solicitar-promocao', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email, tipo_de_usuario } = req.body;
            // Verificação de dados incompletos
            if (!email || !tipo_de_usuario) {
                console.log("Dados incompletos:", req.body); // Log para verificar o corpo da requisição
                return reply.status(400).send({ message: 'Dados incompletos.' });
            }
            // Normalização do tipo de usuário
            const normalizedTipo = tipo_de_usuario.toUpperCase();
            const novoTipo = normalizedTipo === 'USER'
                ? 'MENTOR'
                : normalizedTipo === 'MENTOR'
                    ? 'ADMIN'
                    : null;
            // Verificação se o tipo de usuário é válido
            if (!novoTipo) {
                return reply.status(400).send({ message: 'Você já é ADMIN ou tipo inválido.' });
            }
            try {
                // Log para garantir que estamos tentando adicionar no banco de dados
                console.log("Adicionando solicitação de promoção para o email:", email);
                // Adicionando a solicitação na coleção 'solicitacoes_promocao'
                const solicitação = yield firebaseConfig_1.default.collection('solicitacoes_promocao').add({
                    email,
                    tipoSolicitado: novoTipo,
                    status: 'pendente',
                    criadoEm: new Date(),
                });
                // Log para verificar a inserção do documento
                console.log("Solicitação de promoção adicionada com sucesso:", solicitação.id);
                // Resposta de sucesso
                return reply.status(200).send({ message: 'Solicitação enviada com sucesso!' });
            }
            catch (error) {
                // Log para capturar erros na inserção do banco
                console.error("Erro ao adicionar solicitação:", error);
                return reply.status(500).send({ message: 'Erro ao solicitar promoção.' });
            }
        }));
        // Buscar todas as solicitações de promoção
        app.get('/auth/solicitacoes-promocao', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const solicitacoesSnapshot = yield firebaseConfig_1.default.collection('solicitacoes_promocao').get();
                // Log para verificar o conteúdo das solicitações recuperadas
                console.log("Solicitações de promoção recuperadas:", solicitacoesSnapshot.docs.length);
                const solicitacoes = solicitacoesSnapshot.docs.map((doc) => doc.data());
                // Retornando todas as solicitações
                return reply.send(solicitacoes);
            }
            catch (error) {
                // Log para capturar erros ao buscar solicitações
                console.error('Erro ao buscar solicitações:', error);
                return reply.status(500).send({ message: 'Erro ao buscar solicitações.' });
            }
        }));
        // Endpoint para rejeitar uma solicitação de promoção
        app.post('/auth/rejeitar-solicitacao', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return reply.status(400).send({ message: 'Informe o email do usuário.' });
            }
            try {
                const solicitacaoRef = firebaseConfig_1.default
                    .collection('solicitacoes_promocao')
                    .where('email', '==', email)
                    .where('status', '==', 'pendente')
                    .limit(1);
                const solicitacaoSnapshot = yield solicitacaoRef.get();
                if (solicitacaoSnapshot.empty) {
                    return reply.status(404).send({ message: 'Solicitação não encontrada ou já processada.' });
                }
                solicitacaoSnapshot.forEach((doc) => __awaiter(this, void 0, void 0, function* () {
                    yield doc.ref.update({ status: 'rejeitado' });
                }));
                return reply.status(200).send({ message: 'Solicitação rejeitada com sucesso.' });
            }
            catch (error) {
                console.error('Erro ao rejeitar solicitação:', error);
                return reply.status(500).send({ message: 'Erro ao rejeitar a solicitação.' });
            }
        }));
    });
}
