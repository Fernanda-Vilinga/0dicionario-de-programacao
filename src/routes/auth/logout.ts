import { FastifyInstance } from "fastify";
import db from "../../firebaseConfig";
// Função auxiliar para registrar atividade
export  async function registrarAtividade(userId: string, descricao: string, acao: string) {
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
export default async function logoutRoutes(app: FastifyInstance) {
  app.post("/auth/logout", async (req, reply) => {
    try {
      const { usuarioId } = req.body as { usuarioId: string };
  
      if (!usuarioId) {
        return reply.status(400).send({ message: "ID do usuário não informado." });
      }
  
      console.log("UserId no Logout:", usuarioId);
  
      const userDoc = await db.collection("usuarios").doc(usuarioId).get();
  
      if (!userDoc.exists) {
        return reply.status(404).send({ message: "Usuário não encontrado." });
      }
  
      const userData = userDoc.data();
      const nomeParaRegistro = userData?.nome || "Usuário";
  
      await db.collection("usuarios").doc(usuarioId).update({
        online: false,
      });
  
      // Descrição mais amigável
      const descricao = `${nomeParaRegistro} fez logout.`;
      const acao = "Logout";
  
      await registrarAtividade(usuarioId, descricao, acao);
  
      return reply.send({ message: "Logout bem-sucedido" });
  
    } catch (error) {
      console.error("Erro no logout:", error);
      return reply.status(500).send({ message: "Erro ao fazer logout." });
    }
  });
  
}
