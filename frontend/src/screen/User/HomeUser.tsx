import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderHome from '../HeaderHomes';
import SettingModal from './SettingModal';
import { RootStackParamList } from '../../types/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import AnimatedTitle from './AnimatedTitle';
// Importando as telas
import DicionaryScreen from './DicionaryScreen';
import QuizScreen from './QuizScreen';
import NotesScreen from './NotesScreen';
import MentorShipScreen from './MentorShipScreen';
import { ThemeContext } from 'src/context/ThemeContext';

const Tab = createBottomTabNavigator();

const DashboardScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Dicionario'>>();
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <HeaderHome 
        screenName="Dicionário de Programação" 
        onOpenSettings={() => setModalVisible(true)}
      />

      <ScrollView 
        contentContainerStyle={styles.content} 
        nestedScrollEnabled={true} // Permite que o scroll horizontal funcione dentro do vertical
      >
        {/* Seção 1: Aprenda a desenvolver */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <AnimatedTitle style={[styles.sectionTitle, { color: theme.textColor }]}>
            Aprenda a desenvolver
          </AnimatedTitle>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true} 
            style={styles.horizontalScroll}  
            contentContainerStyle={styles.scrollContent}
          >
            {/* Mais imagens para a área "Aprenda a desenvolver" */}
            <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.X5HzCSVlvaCqMysd4zFTqwHaEK?w=267&h=180&c=7&r=0&o=5&pid=1.7' }} 
              style={styles.image} 
            />
             <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.5ZAYaVbjAnp9Lyf8VGr3XQHaDl?rs=1&pid=ImgDetMain' }} 
              style={styles.image} 
            />
            <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.Gysh2-08QcClF7U_E3EcgQHaDF?w=315&h=182&c=7&r=0&o=5&pid=1.7' }} 
              style={styles.image} 
            />
            <Image 
              source={{ uri:'https://blog.rotamaxima.com/wp-content/uploads/2020/02/desenvolvimento-de-APP-1024x682.jpg'}} 
              style={styles.image} 
            />
           
          </ScrollView>
          <Text style={[styles.sectionText, { color: theme.textColor }]}>
            Explore conteúdos e dicas para aprimorar suas habilidades de programação.
          </Text>
        </View>

        {/* Seção 2: Descubra o universo da programação */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <AnimatedTitle style={[styles.sectionTitle, { color: theme.textColor }]}>
            Descubra o universo da programação
          </AnimatedTitle>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.horizontalScroll}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Mais imagens para a área "Descubra o universo da programação" */}
            <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.cn2B5vFHGnXBEPoGY0Iv7QHaFx?w=220&h=180&c=7&r=0&o=5&pid=1.7' }} 
              style={styles.image} 
            />
              <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.mXftDH_VRoxgPBBYzvxTKgAAAA?w=304&h=180&c=7&r=0&o=5&pid=1.7' }} 
              style={styles.image} 
            />
            <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.Sl9c9UGVCU4CvDYdY4nN3QHaD8?w=280&h=180&c=7&r=0&o=5&pid=1.7' }} 
              style={styles.image} 
            />
          
            <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.Yq9TltP_cLf9U1jMCknUtwHaEK?w=270&h=180&c=7&r=0&o=5&pid=1.7' }} 
              style={styles.image} 
            />
          </ScrollView>
          <Text style={[styles.sectionText, { color: theme.textColor }]}>
            Conheça diferentes áreas da tecnologia e encontre seu caminho na programação.
          </Text>
        </View>

        {/* Seção 3: Enriqueça o teu vocabulário */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <AnimatedTitle style={[styles.sectionTitle, { color: theme.textColor }]}>
            Enriqueça o teu vocabulário
          </AnimatedTitle>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.horizontalScroll}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Mais imagens para a área "Enriqueça o teu vocabulário" */}
            <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.6OzfVSt28q251iTFG9aofwHaHa?w=155&h=180&c=7&r=0&o=5&pid=1.7' }} 
              style={styles.image} 
            />
               <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.4XB7MWvEt46X7vJfNtWYZwHaEK?w=283&h=180&c=7&r=0&o=5&pid=1.7' }} 
              style={styles.image} 
            />
            <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP._vo3mZk-EOBGz6Fi-zwvrgHaEo?w=258&h=180&c=7&r=0&o=5&pid=1.7' }} 
              style={styles.image} 
            />
            <Image 
              source={{ uri: 'https://th.bing.com/th/id/OIP.a2gWOKvh9YDG_swoyXZsLwHaFJ?rs=1&pid=ImgDetMain' }} 
              style={styles.image} 
            />
          
            
          </ScrollView>
          <Text style={[styles.sectionText, { color: theme.textColor }]}>
            Amplie seu conhecimento com definições e conceitos essenciais do mundo da programação.
          </Text>
        </View>
      </ScrollView>

      {/* Modal de configurações */}
      <SettingModal isVisible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const icons = {
          Home: "home",
          Dicionário: "menu-book",
          "Bloco de Notas": "edit-note",
          Quiz: "quiz",
          Mentoria: "school",
        } as const;
        return {
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name={icons[route.name as keyof typeof icons]} size={size} color={color} />
          ),
          tabBarActiveTintColor: "#2979FF",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { backgroundColor: "#fff", paddingBottom: 5, height: 60 },
        };
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Dicionário" component={DicionaryScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Bloco de Notas" component={NotesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Quiz" component={QuizScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Mentoria" component={MentorShipScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // O fundo será definido dinamicamente com o tema
  },
  content: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  section: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
    // backgroundColor e borderColor serão definidos dinamicamente
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    // A cor também será aplicada dinamicamente
  },
  sectionText: {
    fontSize: 14,
    textAlign: 'center',
    // A cor será aplicada dinamicamente
  },
  horizontalScroll: {
    height: 220, // Altura fixa para o scroll horizontal
    marginBottom: 10,
  },
  scrollContent: {
    flexDirection: 'row', 
    paddingHorizontal: 10,
  },
  image: {
    width: 300,
    height: 200,
    borderRadius: 10,
    marginRight: 10,
  }, 
});

export default TabNavigator;
