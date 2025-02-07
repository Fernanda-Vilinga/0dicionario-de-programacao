import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import authenticate from './minddlewares/authenticate';

const app = fastify({ logger: true });

// Configurar JWT
app.register(fastifyJwt, {
  secret: 'Vilinga-key',
});

// Registrar o middleware de autenticação
authenticate(app);

// Resto da lógica (rotas, etc.)
export default app;
