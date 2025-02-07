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
exports.default = profileRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function profileRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.get('/perfil/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const userDoc = yield firebaseConfig_1.default.collection('usuarios').doc(id).get();
                if (!userDoc.exists)
                    return reply.status(404).send({ message: 'Usuário não encontrado' });
                return reply.send(userDoc.data());
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao buscar perfil' });
            }
        }));
    });
}
