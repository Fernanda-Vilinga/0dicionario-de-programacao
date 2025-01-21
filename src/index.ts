import fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import bcrypt from 'bcrypt';
import db from './firebaseConfig';



// Extensão do tipo Fastify
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: any, reply: any) => Promise<void>;
  }
}

const app = fastify({ logger: true });

// Configurar JWT
app.register(fastifyJwt, {
  secret: 'Vilinga-key',
});

// Middleware para verificar JWT
app.decorate('authenticate', async (req: any, reply: any) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Rota inicial
app.get('/', async () => {
  return { message: 'API do Dicionário de Programação em funcionamento!' };
});

// Rota para registrar administrador (somente um admin pré-cadastrado)
app.post('/auth/registeradmin', async (req, reply) => {
  const { nome, email, senha } = req.body as { nome: string; email: string; senha: string; };

  if (!nome || !email || !senha) {
    return reply.status(400).send({ message: 'Preencha todos os campos.' });
  }

  try {
    const userRef = db.collection('usuarios').where('email', '==', email).limit(1);
    const existingUser = await userRef.get();

    if (!existingUser.empty) {
      return reply.status(400).send({ message: 'Usuário já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const newAdmin = await db.collection('usuarios').add({
      nome,
      email,
      senha: hashedPassword,
      tipo_de_usuario: 'ADMIN',
    });

    return reply.status(201).send({ message: 'Administrador criado com sucesso', id: newAdmin.id });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ message: 'Erro ao criar administrador' });
  }
});

// Rota para registrar um usuário comum (USER)
app.post('/auth/registeruser', async (req, reply) => {
  const { nome, email, senha } = req.body as { nome: string; email: string; senha: string; };

  if (!nome || !email || !senha) {
    return reply.status(400).send({ message: 'Preencha todos os campos.' });
  }

  try {
    const userRef = db.collection('usuarios').where('email', '==', email).limit(1);
    const existingUser = await userRef.get();

    if (!existingUser.empty) {
      return reply.status(400).send({ message: 'Usuário já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const newUser = await db.collection('usuarios').add({
      nome,
      email,
      senha: hashedPassword,
      tipo_de_usuario: 'USER',
    });

    return reply.status(201).send({ message: 'Usuário criado com sucesso', id: newUser.id });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ message: 'Erro ao criar usuário' });
  }
});

// Rota para solicitar promoção a mentor
app.post('/auth/promovermentores', { preHandler: [app.authenticate] }, async (req, reply) => {
  const { email } = req.body as { email: string; };
  
  if (!email) {
    return reply.status(400).send({ message: 'Preencha o email do usuário.' });
  }

  try {
    const userRef = db.collection('usuarios').where('email', '==', email).limit(1);
    const user = await userRef.get();

    if (user.empty) {
      return reply.status(404).send({ message: 'Usuário não encontrado.' });
    }

    const userData = user.docs[0].data();

    // Verifica se o usuário já é um mentor
    if (userData.tipo_de_usuario === 'MENTOR') {
      return reply.status(400).send({ message: 'Usuário já é mentor.' });
    }

    // Atualiza o tipo de usuário para MENTOR
    await user.docs[0].ref.update({ tipo_de_usuario: 'MENTOR' });

    return reply.status(200).send({ message: 'Usuário promovido a mentor com sucesso!' });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ message: 'Erro ao promover usuário.' });
  }
});

// Outras rotas podem ser adicionadas aqui...
// Rota para login (adicionar ao seu servidor)
app.post('/auth/login', async (req, reply) => {
  const { email, senha } = req.body as { email: string; senha: string; };

  if (!email || !senha) {
    return reply.status(400).send({ message: 'Preencha todos os campos.' });
  }

  try {
    const userRef = db.collection('usuarios').where('email', '==', email).limit(1);
    const user = await userRef.get();

    if (user.empty) {
      return reply.status(404).send({ message: 'Usuário não encontrado.' });
    }

    const userData = user.docs[0].data();
    const match = await bcrypt.compare(senha, userData.senha);

    if (!match) {
      return reply.status(401).send({ message: 'Senha incorreta.' });
    }

    const token = app.jwt.sign({ id: user.docs[0].id });
    return reply.send({ message: 'Login bem-sucedido', nome: userData.nome, token });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ message: 'Erro no login' });
  }
});

export default app;