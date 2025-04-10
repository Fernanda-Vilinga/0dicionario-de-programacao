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
exports.default = logoutRoutes;
const firebaseConfig_1 = __importDefault(require("../../firebaseConfig"));
function logoutRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.post("/auth/logout", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { usuarioId } = req.body;
                if (!usuarioId) {
                    return reply.status(400).send({ message: "ID do usuário não informado." });
                }
                console.log("UserId no Logout:", usuarioId);
                yield firebaseConfig_1.default.collection("usuarios").doc(usuarioId).update({
                    online: false,
                });
                return reply.send({ message: "Logout bem-sucedido" });
            }
            catch (error) {
                console.error("Erro no logout:", error);
                return reply.status(500).send({ message: "Erro ao fazer logout." });
            }
        }));
    });
}
