import { FastifyInstance , FastifyReply, FastifyRequest } from "fastify";
import db from "../../firebaseConfig";
import { FieldValue } from 'firebase-admin/firestore';
import {  dispararEvento } from '../notificationsservice';
// Função auxiliar para registrar atividade
export async function registrarAtividade(userId: string, descricao: string, acao: string) {
  try {
    await db.collection('atividades').add({
      userId,
      description: descricao,
      action: acao,
      createdAt: new Date(), // Usamos a data atual
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
  }
}
const SUPER_ADMIN_ID = 'mZkU0DJhVMqoIfychMd2';

// Schema JSON para validação de usuarioId
export const solicitarExclusaoSchema = {
  body: {
    type: 'object',
    required: ['usuarioId'],
    properties: {
      usuarioId: { type: 'string' }
    }
  }
};
export default async function promoteMentorRoutes(app: FastifyInstance) {
  // Endpoint para promover usuário a mentor
  app.post("/auth/promovermentores", async (req, reply) => {
    const { email } = req.body as { email: string };

    if (!email) {
      return reply.status(400).send({ message: "Preencha o email do usuário." });
    }

    try {
      const userRef = db.collection("usuarios").where("email", "==", email).limit(1);
      const userSnapshot = await userRef.get();

      if (userSnapshot.empty) {
        return reply.status(404).send({ message: "Usuário não encontrado." });
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.tipo_de_usuario === "MENTOR") {
        return reply.status(400).send({ message: "Usuário já é mentor." });
      }

      // Atualiza o usuário para MENTOR
      await userDoc.ref.update({ tipo_de_usuario: "MENTOR" });

      // Atualiza a solicitação de promoção (caso exista) para "aprovado"
      const solicitacaoRef = db
        .collection("solicitacoes_promocao")
        .where("email", "==", email)
        .where("status", "==", "pendente")
        .limit(1);
      const solicitacaoSnapshot = await solicitacaoRef.get();

      if (!solicitacaoSnapshot.empty) {
        solicitacaoSnapshot.forEach(async (doc) => {
          await doc.ref.update({ status: "aprovado" });
        });
      }

      // Utiliza o nome do usuário para uma mensagem mais natural
      const nomeParaRegistro = userData.nome || email;
      const descricao = `${nomeParaRegistro} foi promovido a MENTOR.`;
      const acao = "Promover a Mentor";
      await registrarAtividade(userDoc.id, descricao, acao);
      // ▪️ Notifica o usuário que pediu promoção de que foi aprovado
     await dispararEvento(
       'promocao.aprovada',
       userDoc.id,
       { nome: nomeParaRegistro, novoTipo: 'MENTOR' }
     );
      return reply.status(200).send({ message: "Usuário promovido a mentor com sucesso!" });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: "Erro ao promover usuário." });
    }
  });

  // Endpoint para promover mentor a admin
  app.post("/auth/promoveradmin", async (req, reply) => {
    const { email } = req.body as { email: string };

    if (!email) {
      return reply.status(400).send({ message: "Preencha o email do usuário." });
    }

    try {
      const userRef = db.collection("usuarios").where("email", "==", email).limit(1);
      const userSnapshot = await userRef.get();

      if (userSnapshot.empty) {
        return reply.status(404).send({ message: "Usuário não encontrado." });
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.tipo_de_usuario === "ADMIN") {
        return reply.status(400).send({ message: "Usuário já é ADMIN." });
      }

      if (userData.tipo_de_usuario !== "MENTOR") {
        return reply.status(400).send({ message: "Apenas mentores podem ser promovidos a admin." });
      }

      // Atualiza o usuário para ADMIN
      await userDoc.ref.update({ tipo_de_usuario: "ADMIN" });

      // Atualiza a solicitação de promoção (caso exista) para "aprovado"
      const solicitacaoRef = db
        .collection("solicitacoes_promocao")
        .where("email", "==", email)
        .where("status", "==", "pendente")
        .limit(1);
      const solicitacaoSnapshot = await solicitacaoRef.get();

      if (!solicitacaoSnapshot.empty) {
        solicitacaoSnapshot.forEach(async (doc) => {
          await doc.ref.update({ status: "aprovado" });
        });
      }

      // Utiliza o nome do usuário para uma mensagem natural
      const nomeParaRegistro = userData.nome || email;
      const descricao = `${nomeParaRegistro} foi promovido a ADMIN.`;
      const acao = "Promover a Admin";
      await registrarAtividade(userDoc.id, descricao, acao);
      // ▪️ Notifica o usuário que pediu promoção de que foi aprovado
     await dispararEvento(
       'promocao.aprovada',
       userDoc.id,
       { nome: nomeParaRegistro, novoTipo: 'ADMIN' }
     );
      return reply.status(200).send({ message: "Usuário promovido a ADMIN com sucesso!" });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: "Erro ao promover usuário a ADMIN." });
    }
  });

  // Endpoint para remover um usuário
  app.delete("/auth/removerusuario", async (req, reply) => {
    const { email } = req.body as { email: string };

    if (!email) {
      return reply.status(400).send({ message: "Informe o email do usuário." });
    }

    try {
      const userRef = db.collection("usuarios").where("email", "==", email).limit(1);
      const userSnapshot = await userRef.get();

      if (userSnapshot.empty) {
        return reply.status(404).send({ message: "Usuário não encontrado." });
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      const nomeParaRegistro = userData.nome || email;

      await userDoc.ref.delete();

      // Registra a atividade de remoção do usuário com mensagem mais natural
      const descricao = `${nomeParaRegistro} foi removido(a) do sistema.`;
      const acao = "Remover Usuário";
      await registrarAtividade(userDoc.id, descricao, acao);

      return reply.status(200).send({ message: "Usuário removido com sucesso." });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: "Erro ao remover usuário." });
    }
  });

  // Endpoint para buscar todos os usuários com foto de perfil, email e nome
  app.get("/auth/usuarios", async (req, reply) => {
    try {
      const usersSnapshot = await db.collection("usuarios").get();
      const users = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome || "Sem nome",
          email: data.email || "",
          profileImage: data.profileImage || null,
          tipo_de_usuario: data.tipo_de_usuario || "USER",
        };
      });
      return reply.send(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return reply.status(500).send({ message: "Erro ao buscar usuários." });
    }
  });

  // Endpoint para solicitar promoção
  app.post("/auth/solicitar-promocao", async (req, reply) => {
    const { email, tipo_de_usuario } = req.body as { email: string; tipo_de_usuario: string };

    if (!email || !tipo_de_usuario) {
      console.log("Dados incompletos:", req.body);
      return reply.status(400).send({ message: "Dados incompletos." });
    }

    const normalizedTipo = tipo_de_usuario.toUpperCase();
    const novoTipo =
      normalizedTipo === "USER"
        ? "MENTOR"
        : normalizedTipo === "MENTOR"
        ? "ADMIN"
        : null;

    if (!novoTipo) {
      return reply.status(400).send({ message: "Você já é ADMIN ou tipo inválido." });
    }

    try {
      console.log("Adicionando solicitação de promoção para o email:", email);

      const solicitacao = await db.collection("solicitacoes_promocao").add({
        email,
        tipoSolicitado: novoTipo,
        status: "pendente",
        criadoEm: new Date(),
      });

      // Busca o nome do usuário para criar uma mensagem natural (se existir)
      const userQuery = await db.collection("usuarios").where("email", "==", email).limit(1).get();
      const nomeParaRegistro = !userQuery.empty && userQuery.docs[0].data().nome
        ? userQuery.docs[0].data().nome
        : email;

      const descricao = `Solicitação de promoção enviada por ${nomeParaRegistro} para o tipo ${novoTipo}.`;
      const acao = "Solicitar Promoção";
      await registrarAtividade(email, descricao, acao);
      // ▪️ Notifica todos os ADMINS sobre a nova solicitação
     await dispararEvento(
       'promocao.solicitar',
      email,
       { email, tipoSolicitado: novoTipo }
     );
      console.log("Solicitação de promoção adicionada com sucesso:", solicitacao.id);
      return reply.status(200).send({ message: "Solicitação enviada com sucesso!" });
    } catch (error) {
      console.error("Erro ao adicionar solicitação:", error);
      return reply.status(500).send({ message: "Erro ao solicitar promoção." });
    }
  });

  // Buscar todas as solicitações de promoção
  app.get("/auth/solicitacoes-promocao", async (req, reply) => {
    try {
      const solicitacoesSnapshot = await db.collection("solicitacoes_promocao").get();
      console.log("Solicitações de promoção recuperadas:", solicitacoesSnapshot.docs.length);
      const solicitacoes = solicitacoesSnapshot.docs.map((doc) => doc.data());
      return reply.send(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      return reply.status(500).send({ message: "Erro ao buscar solicitações." });
    }
  });

  // Endpoint para rejeitar uma solicitação de promoção
  app.post("/auth/rejeitar-solicitacao", async (req, reply) => {
    const { email } = req.body as { email: string };

    if (!email) {
      return reply.status(400).send({ message: "Informe o email do usuário." });
    }

    try {
      const solicitacaoRef = db
        .collection("solicitacoes_promocao")
        .where("email", "==", email)
        .where("status", "==", "pendente")
        .limit(1);
      const solicitacaoSnapshot = await solicitacaoRef.get();

      if (solicitacaoSnapshot.empty) {
        return reply
          .status(404)
          .send({ message: "Solicitação não encontrada ou já processada." });
      }

      solicitacaoSnapshot.forEach(async (doc) => {
        await doc.ref.update({ status: "rejeitado" });
      });

      // Busca o nome do usuário para criar mensagem natural (se existir)
      const userQuery = await db.collection("usuarios").where("email", "==", email).limit(1).get();
      const nomeParaRegistro = !userQuery.empty && userQuery.docs[0].data().nome
        ? userQuery.docs[0].data().nome
        : email;

      const descricao = `Solicitação de promoção para ${nomeParaRegistro} foi rejeitada.`;
      const acao = "Rejeitar Solicitação";
      await registrarAtividade(email, descricao, acao);
       // ▪️ Notifica o usuário que pediu promoção de que foi rejeitada
     await dispararEvento(
       'promocao.rejeitada',
       email,
       { nome: nomeParaRegistro }
     );
      return reply.status(200).send({ message: "Solicitação rejeitada com sucesso." });
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      return reply.status(500).send({ message: "Erro ao rejeitar a solicitação." });
    }
  });
    /**
   * 1. Usuário solicita exclusão de própria conta
   */
  app.post(
    '/auth/solicitar-exclusao',
    { schema: solicitarExclusaoSchema },
    async (
      req: FastifyRequest<{ Body: { usuarioId: string } }>,
      reply: FastifyReply
    ) => {
      const { usuarioId } = req.body;

      // Validações iniciais
      if (!usuarioId) {
        return reply
          .status(400)
          .send({ message: 'Informe o ID do usuário para solicitar exclusão.' });
      }
      if (usuarioId === SUPER_ADMIN_ID) {
        return reply
          .status(403)
          .send({ message: 'Este usuário não pode solicitar exclusão.' });
      }

      try {
        // Verifica existência do usuário
        const userDoc = await db.collection('usuarios').doc(usuarioId).get();
        if (!userDoc.exists) {
          return reply
            .status(404)
            .send({ message: 'Usuário não encontrado.' });
        }
        const userData = userDoc.data()!;
        const email = userData.email as string;
        const nomeParaRegistro = (userData.nome as string) || email;

        // Checa duplicação de solicitações pendentes
        const pendentes = await db
          .collection('solicitacoes_exclusao')
          .where('usuarioId', '==', usuarioId)
          .where('status', '==', 'pendente')
          .get();
        if (!pendentes.empty) {
          return reply
            .status(409)
            .send({ message: 'Já existe uma solicitação pendente.' });
        }

        // Cria a solicitação
        await db.collection('solicitacoes_exclusao').add({
          usuarioId,
          email,
          status: 'pendente',
          criadoEm: FieldValue.serverTimestamp()
        });

        // Registra atividade
        const descricao = `Solicitação de exclusão de conta enviada por ${nomeParaRegistro}.`;
        const acao = 'Solicitar Exclusão de Conta';
        await registrarAtividade(usuarioId, descricao, acao);

        return reply
          .status(201)
          .send({ message: 'Solicitação de exclusão enviada com sucesso.' });
      } catch (error) {
        app.log.error('Erro ao solicitar exclusão de conta:', error);
        return reply
          .status(500)
          .send({ message: 'Erro ao processar solicitação de exclusão.' });
      }
    }
  );

  /**
   * 2. Admin lista todas as solicitações de exclusão
   */
  app.get(
    '/auth/solicitacoes-exclusao',
    async (_req: FastifyRequest, reply: FastifyReply) => {
      try {
        const snapshot = await db.collection('solicitacoes_exclusao').get();
  
        if (snapshot.empty) {
          return reply.send([]);
        }
  
        // 1) Mapeia, mas descarta qualquer doc sem usuarioId e loga um aviso
        const solicitacoesRaw = snapshot.docs
          .map((doc) => {
            const data = doc.data() as any;
            if (!data.usuarioId) {
              app.log.warn(`Solicitação ${doc.id} sem usuarioId — pulando`);
              return null;
            }
            const { usuarioId, ...rest } = data;
            return { id: doc.id, usuarioId, ...rest };
          })
          .filter(
            (s): s is { id: string; usuarioId: string; [k: string]: any } =>
              !!s
          );
  
        // 2) Se não sobrou nada, já retorna vazio
        if (solicitacoesRaw.length === 0) {
          return reply.send([]);
        }
  
        // 3) De-dupe, batch get dos usuários
        const uniqueIds = Array.from(
          new Set(solicitacoesRaw.map((s) => s.usuarioId))
        );
        const userDocs = await Promise.all(
          uniqueIds.map((uid) =>
            db.collection('usuarios').doc(uid).get()
          )
        );
  
        // 4) Só mantém quem existe
        const existingUserIds = new Set(
          userDocs.filter((u) => u.exists).map((u) => u.id)
        );
  
        // 5) Filtra e joga fora o usuarioId antes de enviar
        const filtradas = solicitacoesRaw
          .filter((s) => existingUserIds.has(s.usuarioId))
          .map(({ usuarioId, ...rest }) => rest);
  
        return reply.send(filtradas);
      } catch (error: any) {
        // log detalhado
        app.log.error('Erro ao buscar solicitações de exclusão:', error);
        // temporariamente, devolve mensagem pro front para diagnóstico
        return reply
          .status(500)
          .send({ message: error.message || 'Erro interno no servidor.' });
      }
    }
  );
  
  // DELETE /auth/removerusuario/:id
app.delete("/auth/Autoremoverusuario/:id", async (req, reply) => {
  const { id } = req.params as { id: string };

  try {
    // Busca o documento pelo ID
    const userDoc = await db.collection("usuarios").doc(id).get();
    if (!userDoc.exists) {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }

    const userData = userDoc.data()!;
    // Bloqueia se for ADMIN (opcional)
    if (userData.tipo_de_usuario === "ADMIN") {
      return reply.status(403).send({ message: "Admins não podem se auto‑remover." });
    }

    // Deleta usuário
    await userDoc.ref.delete();
    // Registra atividade
    const nome = userData.nome || userData.email;
    await registrarAtividade(id, `${nome} excluiu sua conta.`, "Auto‑exclusão");

    return reply.status(200).send({ message: "Conta excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao remover usuário:", error);
    return reply.status(500).send({ message: "Erro interno ao excluir conta." });
  }
});
}
