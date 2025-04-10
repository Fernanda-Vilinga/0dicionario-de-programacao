import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import UsersScreen from './UsersScreenAdmin';
import GerenciarDicionario from './DicionayScreenAdmin';
import GerenciarQuizzes from './QuizzesScreenAdmin';
import GerenciarMentoria from './MentorShipScreenAdmin';
import SettingsScreen from '../User/SettingsScreen';
import AdminDashboardScreen from './AdminHome';
import SugestoesScreen from './SugestoesScreen';

const Tab = createBottomTabNavigator();

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Usuários':
              iconName = 'person';
              break;
            case 'Dicionário':
              iconName = 'menu-book';
              break;
            case 'Quizzes':
              iconName = 'quiz';
              break;
            case 'Mentoria':
              iconName = 'school';
              break;
            case 'Sugestões':
              iconName = 'lightbulb';
              break;
            case 'Configurações':
              iconName = 'settings';
              break;
            default:
              iconName = 'dashboard';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2979FF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Usuários" component={UsersScreen} />
      <Tab.Screen name="Dicionário" component={GerenciarDicionario} />
      <Tab.Screen name="Quizzes" component={GerenciarQuizzes} />
      <Tab.Screen name="Mentoria" component={GerenciarMentoria} />
      <Tab.Screen name="Sugestões" component={SugestoesScreen} />
      <Tab.Screen name="Configurações" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default AdminNavigator;

