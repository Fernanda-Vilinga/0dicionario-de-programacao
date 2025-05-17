import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native';
import HeaderComum from '../HeaderComum';
import API_BASE_URL from 'src/config';
import { ThemeContext } from 'src/context/ThemeContext';

// Tipo da avaliação com data em string
interface Avaliacao {
  nota: number;
  comentario?: string;
  categoria?: string;
  data: string;
}

// Dados da sessão
interface Appointment {
  id: string;
  mentorId: string;
  usuarioId: string;
  data: string;
  horario: string;
  status: string;
  categoria?: string;
  planoMentoria?: string;
  motivoRejeicao?: string;
  dataCriacao?: string;
  avaliacao?: Avaliacao;
  mentorEmail?: string;
  usuarioEmail?: string;
}

const MentorshipScreenAdmin = () => {
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [sessions, setSessions] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca email se for UID válido
  const fetchUserEmail = async (userId: string): Promise<string> => {
    if (!userId || userId.length < 10) return 'N/D';
    try {
      const res = await fetch(`${API_BASE_URL}/perfil/${userId}`);
      if (!res.ok) throw new Error();
      const profile = await res.json();
      return profile.email || 'N/D';
    } catch {
      return 'N/D';
    }
  };

  // Carrega sessões, enriquece com emails e formata datas de avaliação
  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mentoria`);
      const data: Appointment[] = await res.json();

      const enriched = await Promise.all(
        data.map(async sess => {
          const [mentorEmail, usuarioEmail] = await Promise.all([
            fetchUserEmail(sess.mentorId),
            fetchUserEmail(sess.usuarioId)
          ]);

          // Formata data de avaliação se existir
          let formattedEval: Avaliacao | undefined;
          if (sess.avaliacao) {
            const rawDate = (sess.avaliacao as any).data;
            let dateStr = rawDate;
            if (rawDate && typeof rawDate === 'object' && rawDate._seconds !== undefined) {
              dateStr = new Date(rawDate._seconds * 1000).toLocaleString();
            }
            formattedEval = { ...sess.avaliacao, data: dateStr };
          }

          return {
            ...sess,
            mentorEmail,
            usuarioEmail,
            avaliacao: formattedEval
          };
        })
      );

      setSessions(enriched);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}><HeaderComum screenName="Sessões de Mentoria" /></View>
      <FlatList
        contentContainerStyle={styles.listContainer}
        data={sessions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>Mentor: {item.mentorEmail}</Text>
            <Text style={styles.text}>Mentorando: {item.usuarioEmail}</Text>
            <Text style={styles.text}>Data: {item.data}  Horário: {item.horario}</Text>
            <Text style={styles.text}>Status: {item.status}</Text>
            {item.categoria && <Text style={styles.text}>Categoria: {item.categoria}</Text>}

            {item.avaliacao ? (
              <View style={styles.evalContainer}>
                <Text style={styles.evalTitle}>Avaliação</Text>
                <Text style={styles.evalText}>Nota: {item.avaliacao.nota}</Text>
                {item.avaliacao.comentario && (
                  <Text style={styles.evalText}>Comentário: {item.avaliacao.comentario}</Text>
                )}
                {item.avaliacao.categoria && (
                  <Text style={styles.evalText}>Categoria: {item.avaliacao.categoria}</Text>
                )}
                <Text style={styles.evalText}>Data: {item.avaliacao.data}</Text>
              </View>
            ) : (
              <Text style={styles.noEval}>Sem avaliação</Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundColor },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundColor },
  header: { paddingTop: 20, backgroundColor: theme.backgroundColor },
  listContainer: { padding: 20 },
  card: { padding: 15, marginVertical: 8, backgroundColor: theme.cardBackground, borderRadius: 8, elevation: 2 },
  text: { fontSize: 16, color: theme.textColor },
  evalContainer: { marginTop: 10, padding: 10, backgroundColor: theme.backgroundSecondary, borderRadius: 6 },
  evalTitle: { fontSize: 16, fontWeight: 'bold', color: theme.textColor },
  evalText: { fontSize: 14, color: theme.textColor, marginTop: 4 },
  noEval: { marginTop: 10, fontSize: 14, fontStyle: 'italic', color: theme.textColor }
});

export default MentorshipScreenAdmin;
