import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderHomes from '../HeaderHomes';
HeaderHomes
const MentorDashboard = () => {
  return (

        
     
    <ScrollView style={styles.container}>
     <View style={styles.header}>
        <HeaderHomes  screenName="Painel do Mentor"/>
                </View>
      {/* Resumo do Perfil */}
      <View style={styles.profileSection}>
        <MaterialIcons name="person" size={50} color="#2979FF" />
        <View>
          <Text style={styles.profileName}>Mako Joveta </Text>
          <Text style={styles.profileRole}>Desenvolvedor Fullstack</Text>
        </View>
      </View>

      {/* Sessões de Mentoria */}
      <Text style={styles.sectionTitle}>Próximas Sessões</Text>
      <View style={styles.section1}>
       
        <View style={styles.card}>
          <Text style={styles.sessionText}>📅 10/02/2025 - 15:00</Text>
          <Text style={styles.sessionText}>👤 Ludmila Panzo</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sessionText}>📅 12/02/2025 - 10:30</Text>
          <Text style={styles.sessionText}>👤 Carlos Lucamba</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sessionText}>📅 10/02/2025 - 15:00</Text>
          <Text style={styles.sessionText}>👤 António Sebastião</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sessionText}>📅 12/02/2025 - 10:30</Text>
          <Text style={styles.sessionText}>👤 Gonçalo dos Santos</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sessionText}>📅 10/02/2025 - 15:00</Text>
          <Text style={styles.sessionText}>👤 Maria Oliveira</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sessionText}>📅 12/02/2025 - 10:30</Text>
          <Text style={styles.sessionText}>👤 Carlos Santos</Text>
        </View>
      
      </View>

      {/* Solicitações Pendentes */}
      <Text style={styles.sectionTitle}>Solicitações Pendentes</Text>
      <View style={styles.section1}>
       
        <View style={styles.card}>
          <Text style={styles.sessionText}>👤 Mariana Vilinga</Text>
          <Text style={styles.sessionText}>📅 15/02/2025 - 14:00</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Aceitar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.sessionText}>👤 Victorino Catumbela</Text>
          <Text style={styles.sessionText}>📅 15/02/2025 - 14:00</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Aceitar</Text>
          </TouchableOpacity>
        </View>  
        <View style={styles.card}>
          <Text style={styles.sessionText}>👤 Joice Neto</Text>
          <Text style={styles.sessionText}>📅 15/02/2025 - 14:00</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Aceitar</Text>
          </TouchableOpacity>
        </View> 
         <View style={styles.card}>
          <Text style={styles.sessionText}>👤 Monifa Tchio</Text>
          <Text style={styles.sessionText}>📅 15/02/2025 - 14:00</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Aceitar</Text>
          </TouchableOpacity>
          
        </View>
        <View style={styles.card}>
          <Text style={styles.sessionText}>👤 Ondjaque Sapalo</Text>
          <Text style={styles.sessionText}>📅 15/02/2025 - 14:00</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Aceitar</Text>
          </TouchableOpacity>
        </View> 
         <View style={styles.card}>
          <Text style={styles.sessionText}>👤 Manuel Ramos</Text>
          <Text style={styles.sessionText}>📅 15/02/2025 - 14:00</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Aceitar</Text>
          </TouchableOpacity>
          
        </View>
        
      </View>

     
    </ScrollView>
   
  );
};

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5',paddingBottom:200},

  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2979FF' },
  profileSection: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 10, marginBottom: 15 },
  profileName: { fontSize: 18, fontWeight: 'bold' },
  profileRole: { fontSize: 14, color: 'gray' },
  section1: { marginBottom: 20 ,alignContent:'center',flexDirection:'row'},
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 30,
    alignContent:'center' },
  card: { backgroundColor: '#fff', padding: 15, 
    borderRadius: 10, marginBottom: 5,
    borderColor:'gray',
    margin:5,
    borderWidth:1 },
  sessionText: { fontSize: 16 },
  button: { backgroundColor: '#2979FF', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { backgroundColor: '#2979FF', padding: 15, borderRadius: 10, alignItems: 'center', flex: 1, marginHorizontal: 5 },
  actionText: { color: 'white', fontWeight: 'bold', marginTop: 5 },
  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  }
});

export default MentorDashboard;
