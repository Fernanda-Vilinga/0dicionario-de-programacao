import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../../firebaseConfig';

const SECRET_KEY = 'seu_segredo_super_secreto'; // Troque por uma chave mais segura e armazene em variáveis de ambiente

export default async function registerAdminRoutes(app: FastifyInstance) {
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

      // Gerar Token JWT
      const token = jwt.sign({ id: newAdmin.id, email, tipo_de_usuario: 'ADMIN' }, SECRET_KEY, {
        expiresIn: '7d',
      });

      return reply.status(201).send({ 
        message: 'Administrador criado com sucesso', 
        id: newAdmin.id,
        token 
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao criar administrador' });
    }
  });
}
