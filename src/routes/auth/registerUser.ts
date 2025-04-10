import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../../firebaseConfig'; // O seu arquivo de configuração do Firebase (não o Admin)
import admin from 'firebase-admin'; // O Admin SDK para salvar timestamps corretamente

const SECRET_KEY = 'seu_segredo_super_secreto'; // Use variável de ambiente em produção

export default async function registerUserRoutes(app: FastifyInstance) {
  app.post('/auth/registeruser', async (req, reply) => {
    const { nome, email, senha } = req.body as { nome: string; email: string; senha: string };

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

      // Use o admin.firestore.Timestamp.now() ou admin.firestore.FieldValue.serverTimestamp() aqui
      const newUser = await db.collection('usuarios').add({
        nome,
        email,
        senha: hashedPassword,
        tipo_de_usuario: 'USER',
        online: false,
        lastLogin: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(), // Garantindo que seja um timestamp do servidor
      });

      const token = jwt.sign(
        { id: newUser.id, email, tipo_de_usuario: 'USER' },
        SECRET_KEY,
        { expiresIn: '7d' }
      );

      return reply.status(201).send({ 
        message: 'Usuário criado com sucesso', 
        id: newUser.id,
        token 
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Erro ao criar usuário' });
    }
  });
}
