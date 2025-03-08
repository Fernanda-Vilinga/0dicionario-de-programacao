import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderComum from '../HeaderComum'; 

// Tipos de ícones válidos do MaterialIcons
type MaterialIconName =
  | "code"
  | "cloud-upload"
  | "school"
  | "security"
  | "storage"
  | "devices"
  | "smartphone"
  | "computer"
  | "palette"
  | "history"
  | "quiz";

interface MenuItemProps {
  icon: MaterialIconName;
  text: string;
  onPress: () => void;
}

// Componente de botão reutilizável com tipagem explícita
const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <MaterialIcons name={icon} size={50} color="#2979FF" />
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);

const QuizScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HeaderComum screenName="Quiz" />
      </View>

      {/* Conteúdo da Tela */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Selecione o tema!</Text>

        <View style={styles.menu}>
          <MenuItem icon="school" text="Algoritmos" onPress={() => {}} />
          <MenuItem icon="code" text="Linguagens de Programação" onPress={() => {}} />
          <MenuItem icon="cloud-upload" text="Cloud" onPress={() => {}} />
          <MenuItem icon="quiz" text="Inteligência Artificial" onPress={() => {}} />
        </View>

        <View style={styles.menu}>
          <MenuItem icon="history" text="Machine Learning" onPress={() => {}} />
          <MenuItem icon="palette" text="Design" onPress={() => {}} />
          <MenuItem icon="security" text="Segurança da Informação" onPress={() => {}} />
          <MenuItem icon="storage" text="Base de Dados" onPress={() => {}} />
        </View>

        <View style={styles.menu}>
          <MenuItem icon="devices" text="IoT" onPress={() => {}} />
          <MenuItem icon="smartphone" text="Desenvolvimento Mobile" onPress={() => {}} />
          <MenuItem icon="computer" text="Desenvolvimento Web" onPress={() => {}} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60, // Ajuste conforme necessário
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1, // Permite que o ScrollView ocupe todo o espaço disponível
    padding: 20,
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: 'black',
  },
  menu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    padding: 15,
    width: 130,
    height: 130,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2979FF',
  },
});

export default QuizScreen;
 