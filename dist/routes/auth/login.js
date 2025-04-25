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
exports.default = loginRoutes;
const bcrypt_1 = __importDefault(require("bcrypt"));
const firebaseConfig_1 = __importDefault(require("../../firebaseConfig"));
const firebase_admin_1 = __importDefault(require("firebase-admin")); // ✅ Import necessário
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
function loginRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.post("/auth/login", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email, senha } = req.body;
            if (!email || !senha) {
                return reply.status(400).send({ message: "Preencha todos os campos." });
            }
            try {
                const userRef = firebaseConfig_1.default.collection("usuarios").where("email", "==", email).limit(1);
                const user = yield userRef.get();
                if (user.empty) {
                    return reply.status(404).send({ message: "Usuário não encontrado." });
                }
                const userDoc = user.docs[0];
                const userData = userDoc.data();
                const usuarioId = userDoc.id;
                if (!userData.senha) {
                    return reply.status(500).send({ message: "Erro no servidor: senha não encontrada." });
                }
                const match = yield bcrypt_1.default.compare(senha, userData.senha);
                if (!match) {
                    return reply.status(401).send({ message: "Senha incorreta." });
                }
                const token = app.jwt.sign({ id: usuarioId });
                const userType = typeof userData.tipo_de_usuario === "string" && userData.tipo_de_usuario.trim() !== ""
                    ? userData.tipo_de_usuario.trim().toUpperCase()
                    : "USUARIO";
                // Atualiza as informações de login do usuário
                yield firebaseConfig_1.default.collection('usuarios').doc(usuarioId).update({
                    lastLogin: firebase_admin_1.default.firestore.Timestamp.now(),
                    online: true
                });
                // Registra a atividade de login
                const descricao = `Usuário ${userData.nome || email} fez login`;
                const acao = "Login";
                yield registrarAtividade(usuarioId, descricao, acao);
                return reply.send({
                    message: "Login bem-sucedido",
                    nome: userData.nome,
                    token,
                    usuarioId,
                    userType,
                });
            }
            catch (error) {
                console.error("❌ Erro no login:", error);
                return reply.status(500).send({ message: "Erro interno no servidor." });
            }
        }));
        // Rota: Solicitação de redefinição
        app.post("/auth/forgot-password", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            if (!email)
                return reply.status(400).send({ message: "Informe o email." });
            try {
                const userSnap = yield firebaseConfig_1.default.collection("usuarios").where("email", "==", email).limit(1).get();
                if (userSnap.empty)
                    return reply.status(404).send({ message: "Usuário não encontrado." });
                const userId = userSnap.docs[0].id;
                return reply.send({ message: "Usuário encontrado.", usuarioId: userId });
            }
            catch (err) {
                console.error("Erro forgot-password:", err);
                return reply.status(500).send({ message: "Erro interno no servidor." });
            }
        }));
        // Rota: Redefinição de senha
        app.post("/auth/reset-password", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { usuarioId, novaSenha } = req.body;
            if (!usuarioId || !novaSenha) {
                return reply.status(400).send({ message: "Preencha todos os campos." });
            }
            try {
                const hash = yield bcrypt_1.default.hash(novaSenha, 10);
                yield firebaseConfig_1.default.collection("usuarios").doc(usuarioId).update({ senha: hash });
                yield registrarAtividade(usuarioId, "Usuário redefiniu a senha", "Reset de senha");
                return reply.send({ message: "Senha redefinida com sucesso." });
            }
            catch (err) {
                console.error("Erro reset-password:", err);
                return reply.status(500).send({ message: "Erro interno no servidor." });
            }
        }));
    });
}
