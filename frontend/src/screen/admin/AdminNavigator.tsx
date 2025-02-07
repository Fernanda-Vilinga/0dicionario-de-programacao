import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import UsersScreen from './UsersScreenAdmin';
import GerenciarDicionario from './DicionayScreenAdmin'
import GerenciarQuizzes from './QuizzesScreenAdmin'
import GerenciarMentoria from './MentorShipScreenAdmin'
import Configuracoes from './SettingsScreenAdmin'
import AdminDashboardScreen from './AdminHome';
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
      <Tab.Screen name="Configurações" component={Configuracoes} />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
