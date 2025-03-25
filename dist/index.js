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
const cors_1 = __importDefault(require("@fastify/cors"));
const formbody_1 = __importDefault(require("@fastify/formbody"));
// Importação das rotas
const statusRoutes_1 = __importDefault(require("./routes/statusRoutes"));
const registerAdmin_1 = __importDefault(require("./routes/auth/registerAdmin"));
const registerUser_1 = __importDefault(require("./routes/auth/registerUser"));
const login_1 = __importDefault(require("./routes/auth/login"));
const promoteMentor_1 = __importDefault(require("./routes/auth/promoteMentor"));
const dictionary_1 = __importDefault(require("./routes/dictionary"));
const quiz_1 = __importDefault(require("./routes/quiz"));
const notes_1 = __importDefault(require("./routes/notes"));
const mentorship_1 = __importDefault(require("./routes/mentorship"));
const chat_1 = __importDefault(require("./routes/chat"));
const perfilRoutes_1 = __importDefault(require("./routes/perfilRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const suggestsRoutes_1 = __importDefault(require("./routes/suggestsRoutes"));
const history_1 = __importDefault(require("./routes/history"));
const about_1 = __importDefault(require("./routes/about"));
const users_1 = __importDefault(require("./routes/users"));
const app = (0, fastify_1.default)({ logger: true });
// 🔹 Configuração do CORS (deve vir antes das rotas!)
app.register(cors_1.default, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
});
// 🔹 Configuração do JWT
app.register(jwt_1.default, {
    secret: 'Vilinga-key',
});
// 🔹 Suporte para JSON no corpo das requisições
app.register(formbody_1.default);
// 🔹 Middleware de autenticação
app.decorate('authenticate', (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield req.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
}));
// 🔹 Registro das Rotas
app.register(statusRoutes_1.default);
app.register(registerAdmin_1.default);
app.register(registerUser_1.default);
app.register(login_1.default);
app.register(promoteMentor_1.default);
app.register(dictionary_1.default);
app.register(quiz_1.default);
app.register(notes_1.default);
app.register(mentorship_1.default);
app.register(chat_1.default);
app.register(perfilRoutes_1.default);
app.register(settingsRoutes_1.default);
app.register(favorites_1.default);
app.register(suggestsRoutes_1.default);
app.register(history_1.default);
app.register(about_1.default);
app.register(users_1.default);
// 🔹 Inicia o servidor
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const PORT = Number(process.env.PORT) || 3030;
        const HOST = '0.0.0.0'; // Permite que o backend seja acessado pelo React Native
        yield app.listen({ port: PORT, host: HOST });
        console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
    }
    catch (err) {
        console.error('Erro ao iniciar o servidor:', err);
        process.exit(1);
    }
});
start();
