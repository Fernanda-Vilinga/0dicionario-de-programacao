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
exports.default = logoutRoutes;
const firebaseConfig_1 = __importDefault(require("../../firebaseConfig"));
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
function logoutRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.post("/auth/logout", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { usuarioId } = req.body;
                if (!usuarioId) {
                    return reply.status(400).send({ message: "ID do usuário não informado." });
                }
                console.log("UserId no Logout:", usuarioId);
                const userDoc = yield firebaseConfig_1.default.collection("usuarios").doc(usuarioId).get();
                if (!userDoc.exists) {
                    return reply.status(404).send({ message: "Usuário não encontrado." });
                }
                const userData = userDoc.data();
                const nomeParaRegistro = (userData === null || userData === void 0 ? void 0 : userData.nome) || "Usuário";
                yield firebaseConfig_1.default.collection("usuarios").doc(usuarioId).update({
                    online: false,
                });
                // Descrição mais amigável
                const descricao = `${nomeParaRegistro} fez logout.`;
                const acao = "Logout";
                yield registrarAtividade(usuarioId, descricao, acao);
                return reply.send({ message: "Logout bem-sucedido" });
            }
            catch (error) {
                console.error("Erro no logout:", error);
                return reply.status(500).send({ message: "Erro ao fazer logout." });
            }
        }));
    });
}
