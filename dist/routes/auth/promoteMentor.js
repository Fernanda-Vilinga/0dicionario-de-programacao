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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.solicitarExclusaoSchema = void 0;
exports.registrarAtividade = registrarAtividade;
exports.default = promoteMentorRoutes;
const firebaseConfig_1 = __importDefault(require("../../firebaseConfig"));
const firestore_1 = require("firebase-admin/firestore");
const notificationsservice_1 = require("../notificationsservice");
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
const SUPER_ADMIN_ID = 'mZkU0DJhVMqoIfychMd2';
// Schema JSON para validação de usuarioId
exports.solicitarExclusaoSchema = {
    body: {
        type: 'object',
        required: ['usuarioId'],
        properties: {
            usuarioId: { type: 'string' }
        }
    }
};
function promoteMentorRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Endpoint para promover usuário a mentor
        app.post("/auth/promovermentores", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return reply.status(400).send({ message: "Preencha o email do usuário." });
            }
            try {
                const userRef = firebaseConfig_1.default.collection("usuarios").where("email", "==", email).limit(1);
                const userSnapshot = yield userRef.get();
                if (userSnapshot.empty) {
                    return reply.status(404).send({ message: "Usuário não encontrado." });
                }
                const userDoc = userSnapshot.docs[0];
                const userData = userDoc.data();
                if (userData.tipo_de_usuario === "MENTOR") {
                    return reply.status(400).send({ message: "Usuário já é mentor." });
                }
                // Atualiza o usuário para MENTOR
                yield userDoc.ref.update({ tipo_de_usuario: "MENTOR" });
                // Atualiza a solicitação de promoção (caso exista) para "aprovado"
                const solicitacaoRef = firebaseConfig_1.default
                    .collection("solicitacoes_promocao")
                    .where("email", "==", email)
                    .where("status", "==", "pendente")
                    .limit(1);
                const solicitacaoSnapshot = yield solicitacaoRef.get();
                if (!solicitacaoSnapshot.empty) {
                    solicitacaoSnapshot.forEach((doc) => __awaiter(this, void 0, void 0, function* () {
                        yield doc.ref.update({ status: "aprovado" });
                    }));
                }
                // Utiliza o nome do usuário para uma mensagem mais natural
                const nomeParaRegistro = userData.nome || email;
                const descricao = `${nomeParaRegistro} foi promovido a MENTOR.`;
                const acao = "Promover a Mentor";
                yield registrarAtividade(userDoc.id, descricao, acao);
                // ▪️ Notifica o usuário que pediu promoção de que foi aprovado
                yield (0, notificationsservice_1.dispararEvento)('promocao.aprovada', userDoc.id, { nome: nomeParaRegistro, novoTipo: 'MENTOR' });
                return reply.status(200).send({ message: "Usuário promovido a mentor com sucesso!" });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: "Erro ao promover usuário." });
            }
        }));
        // Endpoint para promover mentor a admin
        app.post("/auth/promoveradmin", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return reply.status(400).send({ message: "Preencha o email do usuário." });
            }
            try {
                const userRef = firebaseConfig_1.default.collection("usuarios").where("email", "==", email).limit(1);
                const userSnapshot = yield userRef.get();
                if (userSnapshot.empty) {
                    return reply.status(404).send({ message: "Usuário não encontrado." });
                }
                const userDoc = userSnapshot.docs[0];
                const userData = userDoc.data();
                if (userData.tipo_de_usuario === "ADMIN") {
                    return reply.status(400).send({ message: "Usuário já é ADMIN." });
                }
                if (userData.tipo_de_usuario !== "MENTOR") {
                    return reply.status(400).send({ message: "Apenas mentores podem ser promovidos a admin." });
                }
                // Atualiza o usuário para ADMIN
                yield userDoc.ref.update({ tipo_de_usuario: "ADMIN" });
                // Atualiza a solicitação de promoção (caso exista) para "aprovado"
                const solicitacaoRef = firebaseConfig_1.default
                    .collection("solicitacoes_promocao")
                    .where("email", "==", email)
                    .where("status", "==", "pendente")
                    .limit(1);
                const solicitacaoSnapshot = yield solicitacaoRef.get();
                if (!solicitacaoSnapshot.empty) {
                    solicitacaoSnapshot.forEach((doc) => __awaiter(this, void 0, void 0, function* () {
                        yield doc.ref.update({ status: "aprovado" });
                    }));
                }
                // Utiliza o nome do usuário para uma mensagem natural
                const nomeParaRegistro = userData.nome || email;
                const descricao = `${nomeParaRegistro} foi promovido a ADMIN.`;
                const acao = "Promover a Admin";
                yield registrarAtividade(userDoc.id, descricao, acao);
                // ▪️ Notifica o usuário que pediu promoção de que foi aprovado
                yield (0, notificationsservice_1.dispararEvento)('promocao.aprovada', userDoc.id, { nome: nomeParaRegistro, novoTipo: 'ADMIN' });
                return reply.status(200).send({ message: "Usuário promovido a ADMIN com sucesso!" });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: "Erro ao promover usuário a ADMIN." });
            }
        }));
        // Endpoint para remover um usuário
        app.delete("/auth/removerusuario", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return reply.status(400).send({ message: "Informe o email do usuário." });
            }
            try {
                const userRef = firebaseConfig_1.default.collection("usuarios").where("email", "==", email).limit(1);
                const userSnapshot = yield userRef.get();
                if (userSnapshot.empty) {
                    return reply.status(404).send({ message: "Usuário não encontrado." });
                }
                const userDoc = userSnapshot.docs[0];
                const userData = userDoc.data();
                const nomeParaRegistro = userData.nome || email;
                yield userDoc.ref.delete();
                // Registra a atividade de remoção do usuário com mensagem mais natural
                const descricao = `${nomeParaRegistro} foi removido(a) do sistema.`;
                const acao = "Remover Usuário";
                yield registrarAtividade(userDoc.id, descricao, acao);
                return reply.status(200).send({ message: "Usuário removido com sucesso." });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: "Erro ao remover usuário." });
            }
        }));
        // Endpoint para buscar todos os usuários com foto de perfil, email e nome
        app.get("/auth/usuarios", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const usersSnapshot = yield firebaseConfig_1.default.collection("usuarios").get();
                const users = usersSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        nome: data.nome || "Sem nome",
                        email: data.email || "",
                        profileImage: data.profileImage || null,
                        tipo_de_usuario: data.tipo_de_usuario || "USER",
                    };
                });
                return reply.send(users);
            }
            catch (error) {
                console.error("Erro ao buscar usuários:", error);
                return reply.status(500).send({ message: "Erro ao buscar usuários." });
            }
        }));
        // Endpoint para solicitar promoção
        app.post("/auth/solicitar-promocao", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email, tipo_de_usuario } = req.body;
            if (!email || !tipo_de_usuario) {
                console.log("Dados incompletos:", req.body);
                return reply.status(400).send({ message: "Dados incompletos." });
            }
            const normalizedTipo = tipo_de_usuario.toUpperCase();
            const novoTipo = normalizedTipo === "USER"
                ? "MENTOR"
                : normalizedTipo === "MENTOR"
                    ? "ADMIN"
                    : null;
            if (!novoTipo) {
                return reply.status(400).send({ message: "Você já é ADMIN ou tipo inválido." });
            }
            try {
                console.log("Adicionando solicitação de promoção para o email:", email);
                const solicitacao = yield firebaseConfig_1.default.collection("solicitacoes_promocao").add({
                    email,
                    tipoSolicitado: novoTipo,
                    status: "pendente",
                    criadoEm: new Date(),
                });
                // Busca o nome do usuário para criar uma mensagem natural (se existir)
                const userQuery = yield firebaseConfig_1.default.collection("usuarios").where("email", "==", email).limit(1).get();
                const nomeParaRegistro = !userQuery.empty && userQuery.docs[0].data().nome
                    ? userQuery.docs[0].data().nome
                    : email;
                const descricao = `Solicitação de promoção enviada por ${nomeParaRegistro} para o tipo ${novoTipo}.`;
                const acao = "Solicitar Promoção";
                yield registrarAtividade(email, descricao, acao);
                // ▪️ Notifica todos os ADMINS sobre a nova solicitação
                yield (0, notificationsservice_1.dispararEvento)('promocao.solicitar', email, { email, tipoSolicitado: novoTipo });
                console.log("Solicitação de promoção adicionada com sucesso:", solicitacao.id);
                return reply.status(200).send({ message: "Solicitação enviada com sucesso!" });
            }
            catch (error) {
                console.error("Erro ao adicionar solicitação:", error);
                return reply.status(500).send({ message: "Erro ao solicitar promoção." });
            }
        }));
        // Buscar todas as solicitações de promoção
        app.get("/auth/solicitacoes-promocao", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const solicitacoesSnapshot = yield firebaseConfig_1.default.collection("solicitacoes_promocao").get();
                console.log("Solicitações de promoção recuperadas:", solicitacoesSnapshot.docs.length);
                const solicitacoes = solicitacoesSnapshot.docs.map((doc) => doc.data());
                return reply.send(solicitacoes);
            }
            catch (error) {
                console.error("Erro ao buscar solicitações:", error);
                return reply.status(500).send({ message: "Erro ao buscar solicitações." });
            }
        }));
        // Endpoint para rejeitar uma solicitação de promoção
        app.post("/auth/rejeitar-solicitacao", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email) {
                return reply.status(400).send({ message: "Informe o email do usuário." });
            }
            try {
                const solicitacaoRef = firebaseConfig_1.default
                    .collection("solicitacoes_promocao")
                    .where("email", "==", email)
                    .where("status", "==", "pendente")
                    .limit(1);
                const solicitacaoSnapshot = yield solicitacaoRef.get();
                if (solicitacaoSnapshot.empty) {
                    return reply
                        .status(404)
                        .send({ message: "Solicitação não encontrada ou já processada." });
                }
                solicitacaoSnapshot.forEach((doc) => __awaiter(this, void 0, void 0, function* () {
                    yield doc.ref.update({ status: "rejeitado" });
                }));
                // Busca o nome do usuário para criar mensagem natural (se existir)
                const userQuery = yield firebaseConfig_1.default.collection("usuarios").where("email", "==", email).limit(1).get();
                const nomeParaRegistro = !userQuery.empty && userQuery.docs[0].data().nome
                    ? userQuery.docs[0].data().nome
                    : email;
                const descricao = `Solicitação de promoção para ${nomeParaRegistro} foi rejeitada.`;
                const acao = "Rejeitar Solicitação";
                yield registrarAtividade(email, descricao, acao);
                // ▪️ Notifica o usuário que pediu promoção de que foi rejeitada
                yield (0, notificationsservice_1.dispararEvento)('promocao.rejeitada', email, { nome: nomeParaRegistro });
                return reply.status(200).send({ message: "Solicitação rejeitada com sucesso." });
            }
            catch (error) {
                console.error("Erro ao rejeitar solicitação:", error);
                return reply.status(500).send({ message: "Erro ao rejeitar a solicitação." });
            }
        }));
        /**
       * 1. Usuário solicita exclusão de própria conta
       */
        app.post('/auth/solicitar-exclusao', { schema: exports.solicitarExclusaoSchema }, (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId } = req.body;
            // Validações iniciais
            if (!usuarioId) {
                return reply
                    .status(400)
                    .send({ message: 'Informe o ID do usuário para solicitar exclusão.' });
            }
            if (usuarioId === SUPER_ADMIN_ID) {
                return reply
                    .status(403)
                    .send({ message: 'Este usuário não pode solicitar exclusão.' });
            }
            try {
                // Verifica existência do usuário
                const userDoc = yield firebaseConfig_1.default.collection('usuarios').doc(usuarioId).get();
                if (!userDoc.exists) {
                    return reply
                        .status(404)
                        .send({ message: 'Usuário não encontrado.' });
                }
                const userData = userDoc.data();
                const email = userData.email;
                const nomeParaRegistro = userData.nome || email;
                // Checa duplicação de solicitações pendentes
                const pendentes = yield firebaseConfig_1.default
                    .collection('solicitacoes_exclusao')
                    .where('usuarioId', '==', usuarioId)
                    .where('status', '==', 'pendente')
                    .get();
                if (!pendentes.empty) {
                    return reply
                        .status(409)
                        .send({ message: 'Já existe uma solicitação pendente.' });
                }
                // Cria a solicitação
                yield firebaseConfig_1.default.collection('solicitacoes_exclusao').add({
                    usuarioId,
                    email,
                    status: 'pendente',
                    criadoEm: firestore_1.FieldValue.serverTimestamp()
                });
                // Registra atividade
                const descricao = `Solicitação de exclusão de conta enviada por ${nomeParaRegistro}.`;
                const acao = 'Solicitar Exclusão de Conta';
                yield registrarAtividade(usuarioId, descricao, acao);
                return reply
                    .status(201)
                    .send({ message: 'Solicitação de exclusão enviada com sucesso.' });
            }
            catch (error) {
                app.log.error('Erro ao solicitar exclusão de conta:', error);
                return reply
                    .status(500)
                    .send({ message: 'Erro ao processar solicitação de exclusão.' });
            }
        }));
        /**
         * 2. Admin lista todas as solicitações de exclusão
         */
        app.get('/auth/solicitacoes-exclusao', (_req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const snapshot = yield firebaseConfig_1.default.collection('solicitacoes_exclusao').get();
                if (snapshot.empty) {
                    return reply.send([]);
                }
                // 1) Mapeia, mas descarta qualquer doc sem usuarioId e loga um aviso
                const solicitacoesRaw = snapshot.docs
                    .map((doc) => {
                    const data = doc.data();
                    if (!data.usuarioId) {
                        app.log.warn(`Solicitação ${doc.id} sem usuarioId — pulando`);
                        return null;
                    }
                    const { usuarioId } = data, rest = __rest(data, ["usuarioId"]);
                    return Object.assign({ id: doc.id, usuarioId }, rest);
                })
                    .filter((s) => !!s);
                // 2) Se não sobrou nada, já retorna vazio
                if (solicitacoesRaw.length === 0) {
                    return reply.send([]);
                }
                // 3) De-dupe, batch get dos usuários
                const uniqueIds = Array.from(new Set(solicitacoesRaw.map((s) => s.usuarioId)));
                const userDocs = yield Promise.all(uniqueIds.map((uid) => firebaseConfig_1.default.collection('usuarios').doc(uid).get()));
                // 4) Só mantém quem existe
                const existingUserIds = new Set(userDocs.filter((u) => u.exists).map((u) => u.id));
                // 5) Filtra e joga fora o usuarioId antes de enviar
                const filtradas = solicitacoesRaw
                    .filter((s) => existingUserIds.has(s.usuarioId))
                    .map((_a) => {
                    var { usuarioId } = _a, rest = __rest(_a, ["usuarioId"]);
                    return rest;
                });
                return reply.send(filtradas);
            }
            catch (error) {
                // log detalhado
                app.log.error('Erro ao buscar solicitações de exclusão:', error);
                // temporariamente, devolve mensagem pro front para diagnóstico
                return reply
                    .status(500)
                    .send({ message: error.message || 'Erro interno no servidor.' });
            }
        }));
        // DELETE /auth/removerusuario/:id
        app.delete("/auth/Autoremoverusuario/:id", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                // Busca o documento pelo ID
                const userDoc = yield firebaseConfig_1.default.collection("usuarios").doc(id).get();
                if (!userDoc.exists) {
                    return reply.status(404).send({ message: "Usuário não encontrado." });
                }
                const userData = userDoc.data();
                // Bloqueia se for ADMIN (opcional)
                if (userData.tipo_de_usuario === "ADMIN") {
                    return reply.status(403).send({ message: "Admins não podem se auto‑remover." });
                }
                // Deleta usuário
                yield userDoc.ref.delete();
                // Registra atividade
                const nome = userData.nome || userData.email;
                yield registrarAtividade(id, `${nome} excluiu sua conta.`, "Auto‑exclusão");
                return reply.status(200).send({ message: "Conta excluída com sucesso." });
            }
            catch (error) {
                console.error("Erro ao remover usuário:", error);
                return reply.status(500).send({ message: "Erro interno ao excluir conta." });
            }
        }));
    });
}
