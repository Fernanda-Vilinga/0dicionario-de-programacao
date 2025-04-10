import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import HeaderComum from '../HeaderComum';
import API_BASE_URL from 'src/config';

// Definindo o tipo dos dados da sessão (appointment)
interface Appointment {
  sessaoId: string;
  mentorId: string;
  usuarioId: string;  // id do mentorando
  data: string;
  horario: string;
  status: string;
  mentorEmail?: string;   // opcional, a ser preenchido após busca
  usuarioEmail?: string;  // opcional, a ser preenchido após busca
}

const MentorshipScreen = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar o perfil e extrair o e-mail
  const fetchUserEmail = async (userId: string): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/perfil/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Se necessário, inclua o token de autenticação
          // 'Authorization': 'Bearer SEU_TOKEN'
        }
      });
      const profile = await response.json();
      return profile.email || "N/D";
    } catch (error) {
      console.error(`Erro ao buscar o perfil do usuário ${userId}:`, error);
      return "N/D";
    }
  };

  // Função para buscar as sessões do admin e então buscar os e-mails
  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/mentorias`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer SEU_TOKEN' // se aplicável
        }
      });
      
      // Supondo que a API retorne um array de objetos com os dados da sessão
      const sessionsData: Appointment[] = await response.json();
      
      // Para cada sessão, buscamos os e-mails dos perfis relacionados (mentor e mentorando)
      const appointmentsWithEmails: Appointment[] = await Promise.all(
        sessionsData.map(async (appointment) => {
          const mentorEmail = await fetchUserEmail(appointment.mentorId);
          const usuarioEmail = await fetchUserEmail(appointment.usuarioId);
          return {
            ...appointment,
            mentorEmail,
            usuarioEmail
          };
        })
      );
      setAppointments(appointmentsWithEmails);
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2979FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderComum screenName="Agendamentos de Mentoria" />
      </View>

      <FlatList
        contentContainerStyle={styles.listContainer}
        data={appointments}
        renderItem={({ item }) => (
          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentText}>
              Mentor: {item.mentorEmail || "N/D"}
            </Text>
            <Text style={styles.appointmentText}>
              Mentorando: {item.usuarioEmail || "N/D"}
            </Text>
            <Text style={styles.appointmentText}>
              Data: {item.data}
            </Text>
            <Text style={styles.appointmentText}>
              Horário: {item.horario}
            </Text>
            <Text style={styles.appointmentText}>
              Status: {item.status}
            </Text>
          
          </View>
        )}
        keyExtractor={(item) => item.sessaoId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 20, // Adicione espaçamento superior, se necessário
    backgroundColor: "#f5f5f5"
  },
  listContainer: {
    padding: 20, 
    paddingTop: 10 // Garante que a lista não fique colada no header
  },
  appointmentCard: {
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  appointmentText: {
    fontSize: 16, 
    color: '#555'
  },
  button: {
    backgroundColor: '#2979FF', 
    padding: 10, 
    borderRadius: 5, 
    marginTop: 10
  },
  buttonText: {
    color: '#fff', 
    fontWeight: 'bold', 
    textAlign: 'center'
  }
});

export default MentorshipScreen;
