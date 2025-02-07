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
exports.default = settingsRoutes;
const firebaseConfig_1 = __importDefault(require("../firebaseConfig"));
function settingsRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.get('/configuracoes/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const configDoc = yield firebaseConfig_1.default.collection('configuracoes').doc(id).get();
                return configDoc.exists ? reply.send(configDoc.data()) : reply.status(404).send({ message: 'Configurações não encontradas' });
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao buscar configurações' });
            }
        }));
    });
}
