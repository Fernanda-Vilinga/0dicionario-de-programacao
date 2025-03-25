import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyFormbody from '@fastify/formbody';

// Importação das rotas
import statusRoutes from './routes/statusRoutes';
import registerAdminRoutes from './routes/auth/registerAdmin';
import registerUserRoutes from './routes/auth/registerUser';
import loginRoutes from './routes/auth/login';
import promoteMentorRoutes from './routes/auth/promoteMentor';
import dicionarioRoutes from './routes/dictionary';
import quizRoutes from './routes/quiz';
import notasRoutes from './routes/notes';
import mentoriaRoutes from './routes/mentorship';
import chatRoutes from './routes/chat';
import profileRoutes from './routes/perfilRoutes';
import settingsRoutes from './routes/settingsRoutes';
import favoritesRoutes from './routes/favorites';
import suggestionsRoutes from './routes/suggestsRoutes';
import historyRoutes from './routes/history';
import aboutRoutes from './routes/about';
import mentorRoutes from './routes/users';
const app = Fastify({ logger: true });

// 🔹 Configuração do CORS (deve vir antes das rotas!)
app.register(fastifyCors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
});

// 🔹 Configuração do JWT
app.register(fastifyJwt, {
  secret: 'Vilinga-key',
});

// 🔹 Suporte para JSON no corpo das requisições
app.register(fastifyFormbody);

// 🔹 Middleware de autenticação
app.decorate('authenticate', async (req: any, reply: any) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// 🔹 Registro das Rotas
app.register(statusRoutes);
app.register(registerAdminRoutes);
app.register(registerUserRoutes);
app.register(loginRoutes);
app.register(promoteMentorRoutes);
app.register(dicionarioRoutes);
app.register(quizRoutes);
app.register(notasRoutes);
app.register(mentoriaRoutes);
app.register(chatRoutes);
app.register(profileRoutes);
app.register(settingsRoutes);
app.register(favoritesRoutes);
app.register(suggestionsRoutes);
app.register(historyRoutes);
app.register(aboutRoutes);
app.register(mentorRoutes);

// 🔹 Inicia o servidor
const start = async () => {
  try {
    const PORT = Number(process.env.PORT) || 3030;
    const HOST = '0.0.0.0'; // Permite que o backend seja acessado pelo React Native

    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  } catch (err) {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
  }
};

start();
