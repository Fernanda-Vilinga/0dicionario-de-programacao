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
        // Rota para obter o perfil do usuário
        app.get('/perfil/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const userDoc = yield firebaseConfig_1.default.collection('usuarios').doc(id).get();
                if (!userDoc.exists) {
                    return reply.status(404).send({ message: 'Usuário não encontrado' });
                }
                return reply.send(userDoc.data());
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao buscar perfil', error });
            }
        }));
        // Rota para atualizar o perfil do usuário (com suporte para mentor)
        app.patch('/perfil/:id', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { nome, bio, profileImage, sobre } = req.body;
            try {
                const userRef = firebaseConfig_1.default.collection('usuarios').doc(id);
                const userDoc = yield userRef.get();
                if (!userDoc.exists) {
                    return reply.status(404).send({ message: 'Usuário não encontrado' });
                }
                const userData = userDoc.data();
                const isMentor = (userData === null || userData === void 0 ? void 0 : userData.role) === 'mentor'; // Verifica se é mentor
                // Constrói o objeto de atualização
                const updateData = {};
                if (nome !== undefined)
                    updateData.nome = nome;
                if (bio !== undefined)
                    updateData.bio = bio;
                if (profileImage !== undefined)
                    updateData.profileImage = profileImage;
                // Apenas mentores podem atualizar o campo "sobre"
                if (isMentor) {
                    if (sobre !== undefined) {
                        updateData.sobre = sobre;
                    }
                }
                else {
                    // Se não for mentor, impede a atualização do campo "sobre"
                    if ("sobre" in req.body) {
                        return reply.status(400).send({ message: 'Usuários normais não podem definir o campo "sobre".' });
                    }
                }
                // Atualiza o documento no Firestore
                yield userRef.update(updateData);
                return reply.send({ message: 'Perfil atualizado com sucesso' });
            }
            catch (error) {
                return reply.status(500).send({ message: 'Erro ao atualizar perfil', error });
            }
        }));
    });
}
