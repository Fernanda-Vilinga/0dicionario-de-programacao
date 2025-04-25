import { FastifyInstance } from 'fastify';
import db from '../firebaseConfig';

// Função auxiliar para registrar atividade (fire-and-forget)
export function registrarAtividade(userId: string, descricao: string, acao: string) {
  db.collection('atividades')
    .add({
      userId,
      description: descricao,
      action: acao,
      createdAt: new Date(), // Usamos a data atual
    })
    .catch(error => {
      console.error('Erro ao registrar atividade:', error);
    });
}

export default async function profileRoutes(app: FastifyInstance) {
  // Rota para obter o perfil de um usuário específico
  app.get('/perfil/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    try {
      const userDoc = await db.collection('usuarios').doc(id).get();

      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }

      return reply.send(userDoc.data());
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao buscar perfil', error });
    }
  });

  // Rota para atualizar o perfil do usuário (com suporte para mentor)
  app.patch('/perfil/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { nome, bio, profileImage, sobre } = req.body as { 
      nome?: string; 
      bio?: string; 
      profileImage?: string;
      sobre?: string;
    };

    try {
      const userRef = db.collection('usuarios').doc(id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return reply.status(404).send({ message: 'Usuário não encontrado' });
      }

      const userData = userDoc.data();
      const isMentor = userData?.role === 'mentor'; // Verifica se é mentor

      // Atualiza os campos comuns a todos os usuários
      const updateData: Record<string, any> = {};
      if (nome) updateData.nome = nome;
      if (bio) updateData.bio = bio;
      if (profileImage) updateData.profileImage = profileImage;

      // Adiciona "sobre" apenas se for mentor e se o campo foi enviado
      if (isMentor && sobre) {
        updateData.sobre = sobre;
      }

      // Realiza a atualização
      await userRef.update(updateData);

      // Registra a atividade no Firestore de forma assíncrona (fire-and-forget)
      const nomeParaRegistro = nome || userData?.nome || 'Usuário';
      const descricao = `${nomeParaRegistro} atualizou seu perfil`;
      const acao = "Atualizar perfil";
      registrarAtividade(id, descricao, acao);

      console.log("Perfil atualizado e atividade registrada.");
      return reply.send({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao atualizar perfil', error });
    }
  });

  // 🔥 Nova rota para buscar todos os mentores 🔥
  app.get('/mentores', async (req, reply) => {
    try {
      const snapshot = await db.collection('usuarios')
        .where('tipo_de_usuario', '==', 'MENTOR')
        .get();
      
      if (snapshot.empty) {
        return reply.status(404).send({ message: 'Nenhum mentor encontrado' });
      }

      const mentores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return reply.send(mentores);
    } catch (error) {
      return reply.status(500).send({ message: 'Erro ao buscar mentores', error });
    }
  });
}
