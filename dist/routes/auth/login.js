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
exports.default = loginRoutes;
const bcrypt_1 = __importDefault(require("bcrypt"));
const firebaseConfig_1 = __importDefault(require("../../firebaseConfig"));
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
                const userDoc = user.docs[0]; // Pegando o documento do usuário
                const userData = userDoc.data();
                console.log("🔍 Usuário encontrado:", userData);
                if (!userData.senha) {
                    return reply.status(500).send({ message: "Erro no servidor: senha não encontrada." });
                }
                const match = yield bcrypt_1.default.compare(senha, userData.senha);
                if (!match) {
                    return reply.status(401).send({ message: "Senha incorreta." });
                }
                const usuarioId = userDoc.id; // Pegando o ID do usuário
                const token = app.jwt.sign({ id: usuarioId });
                // Normalizando tipo de usuário
                const userType = typeof userData.tipo_de_usuario === "string" && userData.tipo_de_usuario.trim() !== ""
                    ? userData.tipo_de_usuario.trim().toUpperCase()
                    : "USUARIO";
                console.log("✅ Login bem-sucedido:", { nome: userData.nome, usuarioId, userType });
                return reply.send({
                    message: "Login bem-sucedido",
                    nome: userData.nome,
                    token,
                    usuarioId, // Agora o ID do usuário será retornado
                    userType,
                });
            }
            catch (error) {
                console.error("❌ Erro no login:", error);
                return reply.status(500).send({ message: "Erro interno no servidor." });
            }
        }));
    });
}
