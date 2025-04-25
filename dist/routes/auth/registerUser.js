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
exports.default = registerUserRoutes;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebaseConfig_1 = __importDefault(require("../../firebaseConfig")); // O seu arquivo de configuração do Firebase (não o Admin)
const firebase_admin_1 = __importDefault(require("firebase-admin")); // O Admin SDK para salvar timestamps corretamente
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
const SECRET_KEY = 'seu_segredo_super_secreto'; // Use variável de ambiente em produção
function registerUserRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.post('/auth/registeruser', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { nome, email, senha } = req.body;
            if (!nome || !email || !senha) {
                return reply.status(400).send({ message: 'Preencha todos os campos.' });
            }
            try {
                const userRef = firebaseConfig_1.default.collection('usuarios').where('email', '==', email).limit(1);
                const existingUser = yield userRef.get();
                if (!existingUser.empty) {
                    return reply.status(400).send({ message: 'Usuário já cadastrado.' });
                }
                const hashedPassword = yield bcrypt_1.default.hash(senha, 10);
                const newUser = yield firebaseConfig_1.default.collection('usuarios').add({
                    nome,
                    email,
                    senha: hashedPassword,
                    tipo_de_usuario: 'USER',
                    online: false,
                    lastLogin: null,
                    createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(), // Garantindo que seja um timestamp do servidor
                });
                // Registra a atividade de criação do usuário com mensagem mais natural
                const descricao = `Usuário ${nome} foi cadastrado com sucesso.`;
                const acao = 'Registro de usuário';
                yield registrarAtividade(newUser.id, descricao, acao);
                const token = jsonwebtoken_1.default.sign({ id: newUser.id, email, tipo_de_usuario: 'USER' }, SECRET_KEY, { expiresIn: '7d' });
                return reply.status(201).send({
                    message: 'Usuário criado com sucesso',
                    id: newUser.id,
                    token
                });
            }
            catch (error) {
                console.error(error);
                return reply.status(500).send({ message: 'Erro ao criar usuário' });
            }
        }));
    });
}
