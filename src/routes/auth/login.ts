import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import db from "../../firebaseConfig";

export default async function loginRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (req, reply) => {
    const { email, senha } = req.body as { email: string; senha: string };

    if (!email || !senha) {
      return reply.status(400).send({ message: "Preencha todos os campos." });
    }

    try {
      const userRef = db.collection("usuarios").where("email", "==", email).limit(1);
      const user = await userRef.get();

      if (user.empty) {
        return reply.status(404).send({ message: "Usuário não encontrado." });
      }

      const userDoc = user.docs[0]; // Pegando o documento do usuário
      const userData = userDoc.data();

      console.log("🔍 Usuário encontrado:", userData);

      if (!userData.senha) {
        return reply.status(500).send({ message: "Erro no servidor: senha não encontrada." });
      }

      const match = await bcrypt.compare(senha, userData.senha);

      if (!match) {
        return reply.status(401).send({ message: "Senha incorreta." });
      }

      const usuarioId = userDoc.id; // Pegando o ID do usuário

      const token = app.jwt.sign({ id: usuarioId });

      // Normalizando tipo de usuário
      const userType =
        typeof userData.tipo_de_usuario === "string" && userData.tipo_de_usuario.trim() !== ""
          ? userData.tipo_de_usuario.trim().toUpperCase()
          : "USUARIO";

      console.log("✅ Login bem-sucedido:", { nome: userData.nome, usuarioId, userType });

      return reply.send({
        message: "Login bem-sucedido",
        nome: userData.nome,
        token,
        usuarioId, // Agora o ID do usuário será retornado
        userType,
      });
    } catch (error) {
      console.error("❌ Erro no login:", error);
      return reply.status(500).send({ message: "Erro interno no servidor." });
    }
  });
}
