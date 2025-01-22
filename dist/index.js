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
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const firebaseConfig_1 = __importDefault(require("./firebaseConfig"));
const app = (0, fastify_1.default)({ logger: true });
// Configurar JWT
app.register(jwt_1.default, {
    secret: 'Vilinga-key',
});
// Middleware para verificar JWT
app.decorate('authenticate', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield req.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
}));
// Rota inicial
app.get('/', () => __awaiter(void 0, void 0, void 0, function* () {
    return { message: 'API do Dicionário de Programação em funcionamento!' };
}));
// Rota para registrar administrador (somente um admin pré-cadastrado)
app.post('/auth/registeradmin', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
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
        const newAdmin = yield firebaseConfig_1.default.collection('usuarios').add({
            nome,
            email,
            senha: hashedPassword,
            tipo_de_usuario: 'ADMIN',
        });
        return reply.status(201).send({ message: 'Administrador criado com sucesso', id: newAdmin.id });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro ao criar administrador' });
    }
}));
// Rota para registrar um usuário comum (USER)
app.post('/auth/registeruser', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
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
        });
        return reply.status(201).send({ message: 'Usuário criado com sucesso', id: newUser.id });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro ao criar usuário' });
    }
}));
// Rota para solicitar promoção a mentor
app.post('/auth/promovermentores', { preHandler: [app.authenticate] }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return reply.status(400).send({ message: 'Preencha o email do usuário.' });
    }
    try {
        const userRef = firebaseConfig_1.default.collection('usuarios').where('email', '==', email).limit(1);
        const user = yield userRef.get();
        if (user.empty) {
            return reply.status(404).send({ message: 'Usuário não encontrado.' });
        }
        const userData = user.docs[0].data();
        // Verifica se o usuário já é um mentor
        if (userData.tipo_de_usuario === 'MENTOR') {
            return reply.status(400).send({ message: 'Usuário já é mentor.' });
        }
        // Atualiza o tipo de usuário para MENTOR
        yield user.docs[0].ref.update({ tipo_de_usuario: 'MENTOR' });
        return reply.status(200).send({ message: 'Usuário promovido a mentor com sucesso!' });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro ao promover usuário.' });
    }
}));
// Outras rotas podem ser adicionadas aqui...
// Rota para login (adicionar ao seu servidor)
app.post('/auth/login', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return reply.status(400).send({ message: 'Preencha todos os campos.' });
    }
    try {
        const userRef = firebaseConfig_1.default.collection('usuarios').where('email', '==', email).limit(1);
        const user = yield userRef.get();
        if (user.empty) {
            return reply.status(404).send({ message: 'Usuário não encontrado.' });
        }
        const userData = user.docs[0].data();
        const match = yield bcrypt_1.default.compare(senha, userData.senha);
        if (!match) {
            return reply.status(401).send({ message: 'Senha incorreta.' });
        }
        const token = app.jwt.sign({ id: user.docs[0].id });
        return reply.send({ message: 'Login bem-sucedido', nome: userData.nome, token });
    }
    catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Erro no login' });
    }
}));
exports.default = app;
