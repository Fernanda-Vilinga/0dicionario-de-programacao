import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../Header';
import { RootStackParamList } from '../../types/types';  // Importar o tipo
import { StackNavigationProp } from '@react-navigation/stack';

type MaterialIconName = 
  | "menu-book"
  | "quiz"
  | "edit-note"
  | "school"
  | "person"
  | "settings"
  | "favorite"
  | "thumb-up"
  | "history"
  | "info";

// Definir tipo de navegação para garantir que está correto
type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dicionario'>;

interface MenuItemProps {
  icon: MaterialIconName;
  text: string;
  onPress: () => void;
}

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();  // Definir a tipagem de navegação

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Bem-vindo ao Dicionário de Programação!</Text>
        <Text style={styles.subtitle}>Enriqueça o teu vocabulário</Text>

        <View style={styles.menu}>
          <MenuItem icon="menu-book" text="Dicionário" onPress={() => navigation.navigate('Dicionario')} />
          <MenuItem icon="quiz" text="Quiz" onPress={() => navigation.navigate('Quiz')} />
          <MenuItem icon="edit-note" text="Bloco de Notas" onPress={() => navigation.navigate('BlocoDeNotas')} />
          <MenuItem icon="school" text="Mentoria" onPress={() => navigation.navigate('Mentoria')} />
        </View>

        <View style={styles.menu}>
          <MenuItem icon="person" text="Perfil" onPress={() => navigation.navigate('Perfil')} />
          <MenuItem icon="settings" text="Definições" onPress={() => navigation.navigate('Definicoes')} />
          <MenuItem icon="favorite" text="Favoritos" onPress={() => navigation.navigate('Favoritos')} />
          <MenuItem icon="thumb-up" text="Sugestões" onPress={() => navigation.navigate('Sugestoes')} />
        </View>

        <View style={styles.menu}>
          <MenuItem icon="history" text="Histórico" onPress={() => navigation.navigate('Historico')} />
          <MenuItem icon="info" text="Sobre" onPress={() => navigation.navigate('Sobre')} />
        </View>
      </ScrollView>
    </View>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <MaterialIcons name={icon} size={50} color="#2979FF" />
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#2979FF',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  menu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 15,
    padding: 10,
    width: 120,
    height: 120,
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
    color: '#2979FF',
  },
});

export default DashboardScreen;
