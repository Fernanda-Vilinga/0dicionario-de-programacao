import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import db from "../../firebaseConfig";
import admin from "firebase-admin"; // ✅ Import necessário

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

      const userDoc = user.docs[0];
      const userData = userDoc.data();
      const usuarioId = userDoc.id;

      if (!userData.senha) {
        return reply.status(500).send({ message: "Erro no servidor: senha não encontrada." });
      }

      const match = await bcrypt.compare(senha, userData.senha);

      if (!match) {
        return reply.status(401).send({ message: "Senha incorreta." });
      }

      const token = app.jwt.sign({ id: usuarioId });

      const userType =
        typeof userData.tipo_de_usuario === "string" && userData.tipo_de_usuario.trim() !== ""
          ? userData.tipo_de_usuario.trim().toUpperCase()
          : "USUARIO";

      // ✅ Corrigido o nome do ID do usuário e o uso do admin
      await db.collection('usuarios').doc(usuarioId).update({
        lastLogin: admin.firestore.Timestamp.now(),
        online: true
      });
      
      return reply.send({
        message: "Login bem-sucedido",
        nome: userData.nome,
        token,
        usuarioId,
        userType,
      });
    } catch (error) {
      console.error("❌ Erro no login:", error);
      return reply.status(500).send({ message: "Erro interno no servidor." });
    }
  });
}
