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
const cors_1 = __importDefault(require("@fastify/cors"));
const server = (0, fastify_1.default)();
// Configurar o CORS para permitir requisições do frontend
server.register(cors_1.default, {
    origin: process.env.FRONTEND_URL, // Substitua pela URL do frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
server.post('/auth/login', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, senha } = request.body;
    // Exemplo de autenticação fictícia
    if (email === 'test@example.com' && senha === '123456') {
        return reply.send({
            token: 'abc123', // Token fictício
            nome: 'Usuário Teste',
        });
    }
    return reply.status(401).send({ message: 'Credenciais inválidas' });
}));
server.post('/auth/registeruser', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { nome, email, senha } = request.body;
    // Exemplo de registro fictício
    return reply.status(201).send({
        message: 'Usuário registrado com sucesso',
        nome,
    });
}));
// Iniciar o servidor
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    const port = process.env.PORT || 8080; // Use a variável de ambiente PORT ou 8080 como padrão
    try {
        yield server.listen({ port: Number(port), host: '0.0.0.0' });
        console.log(`Servidor rodando na porta ${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
});
start();
