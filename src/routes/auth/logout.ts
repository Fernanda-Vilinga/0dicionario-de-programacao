import { FastifyInstance } from "fastify";
import db from "../../firebaseConfig";

export default async function logoutRoutes(app: FastifyInstance) {
  app.post("/auth/logout", async (req, reply) => {
    try {
      const { usuarioId } = req.body as { usuarioId: string };

      if (!usuarioId) {
        return reply.status(400).send({ message: "ID do usuário não informado." });
      }

      console.log("UserId no Logout:", usuarioId);
      await db.collection("usuarios").doc(usuarioId).update({
        online: false,
      });

      return reply.send({ message: "Logout bem-sucedido" });
    } catch (error) {
      console.error("Erro no logout:", error);
      return reply.status(500).send({ message: "Erro ao fazer logout." });
    }
  });
}
