import { FastifyInstance } from 'fastify';
import db from '../firebaseConfig';
import admin from 'firebase-admin'; // Para Timestamp
import { registrarAtividade, distribuirNotificacao, buscarUsuariosPorRole } from './notificationsservice';

export default async function profileRoutes(app: FastifyInstance) {
  // Rota para obter o perfil de um usuário específico
  app.get('/perfil/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const userDoc = await db.collection('usuarios').doc(id).get();
      if (!userDoc.exists)
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      return reply.send(userDoc.data());
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao buscar perfil', error });
    }
  });

  // Rota para atualizar o perfil do usuário (com suporte para mentor e notificações)
  app.patch('/perfil/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { nome, bio, profileImage, sobre, role } = req.body as {
      nome?: string;
      bio?: string;
      profileImage?: string;
      sobre?: string;
      role?: string;
    };

    try {
      const userRef = db.collection('usuarios').doc(id);
      const userDoc = await userRef.get();
      if (!userDoc.exists)
        return reply.status(404).send({ message: 'Usuário não encontrado.' });

      const prevData = userDoc.data()!;
      const wasMentor = prevData.tipo_de_usuario?.toUpperCase() === 'MENTOR';
      const isMentor = (role?.toUpperCase() === 'MENTOR') || wasMentor;

      const updateData: Record<string, any> = {};
      if (nome)         updateData.nome = nome;
      if (bio)          updateData.bio = bio;
      if (profileImage) updateData.profileImage = profileImage;
      if (isMentor && sobre) updateData.sobre = sobre;
      if (role)         updateData.tipo_de_usuario = role.toUpperCase();

      await userRef.update(updateData);

      const displayName = nome || prevData.nome || 'Usuário';
      const descricao   = `${displayName} atualizou seu perfil.`;
      const acao        = 'Atualizar perfil';
      await registrarAtividade(id, descricao, acao);

      // Notificar grupo oposto: users se mentor, mentors se user
      const targetRole = isMentor ? 'user' : 'mentor';
      let destinatarios = await buscarUsuariosPorRole(targetRole);
      destinatarios = destinatarios.filter(uid => uid !== id);
      if (destinatarios.length) {
        await distribuirNotificacao(destinatarios, acao, descricao);
      }

      return reply.send({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao atualizar perfil', error });
    }
  });

  // Nova rota para buscar todos os mentores
  app.get('/mentores', async (req, reply) => {
    try {
      const snapshot = await db.collection('usuarios').where('tipo_de_usuario', '==', 'MENTOR').get();
      if (snapshot.empty)
        return reply.status(404).send({ message: 'Nenhum mentor encontrado' });
      const mentores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return reply.send(mentores);
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao buscar mentores', error });
    }
  });
}
