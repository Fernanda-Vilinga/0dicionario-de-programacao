"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const authenticate_1 = __importDefault(require("./minddlewares/authenticate"));
const app = (0, fastify_1.default)({ logger: true });
// Configurar JWT
app.register(jwt_1.default, {
    secret: 'Vilinga-key',
});
// Registrar o middleware de autenticação
(0, authenticate_1.default)(app);
// Resto da lógica (rotas, etc.)
exports.default = app;
