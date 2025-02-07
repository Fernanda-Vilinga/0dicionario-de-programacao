import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import  statusRoutes  from './routes/status';
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


import { METHODS } from 'http';

const app = Fastify({ logger: true });

// Configuração do JWT
app.register(fastifyJwt, {
  secret: 'Vilinga-key',
});

// Rota para verificar o status da API
app.register(statusRoutes);

// Rotas de autenticação
app.register(registerAdminRoutes);
app.register(registerUserRoutes);
app.register(loginRoutes);
app.register(promoteMentorRoutes);

//Rota do dicionário
app.register(dicionarioRoutes)
//Rota do quiz
app.register(quizRoutes)
//Rota do bloco de notas 
app.register(notasRoutes)
//Rota da mentoria
app.register(mentoriaRoutes)
// Rota de chat
app.register(chatRoutes);


app.register(profileRoutes);
app.register(settingsRoutes);
app.register(favoritesRoutes);
app.register(suggestionsRoutes);
app.register(historyRoutes);
app.register(aboutRoutes);
// Middleware de autenticação
app.decorate('authenticate', async (req: any, reply: any) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});



app.register(fastifyCors,{
  origin:'*',methods:['GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS'],
  allowedHeaders:['Authorization','Content-type'],
})
// Inicia o servidor
const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) });
    console.log(`Servidor rodando em http://localhost:${process.env.PORT}`);
  } catch (err) {
    //app.log.error(err);
    //process.exit(1);
  }
};

start();
