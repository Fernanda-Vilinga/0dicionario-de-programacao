import Fastify from 'fastify';
import cors from '@fastify/cors';

const server = Fastify();

// Configurar o CORS para permitir requisições do frontend
server.register(cors, {
  origin: process.env.FRONTEND_URL, // Substitua pela URL do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

server.post('/auth/login', async (request, reply) => {
  const { email, senha } = request.body as { email: string; senha: string };

  // Exemplo de autenticação fictícia
  if (email === 'test@example.com' && senha === '123456') {
    return reply.send({
      token: 'abc123', // Token fictício
      nome: 'Usuário Teste',
    });
  }
  return reply.status(401).send({ message: 'Credenciais inválidas' });
});

server.post('/auth/registeruser', async (request, reply) => {
  const { nome, email, senha } = request.body as { nome: string; email: string; senha: string };

  // Exemplo de registro fictício
  return reply.status(201).send({
    message: 'Usuário registrado com sucesso',
    nome,
  });
});

// Iniciar o servidor
const start = async () => {
  const port = process.env.PORT || 8080; // Use a variável de ambiente PORT ou 8080 como padrão
  try {
    await server.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`Servidor rodando na porta ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
