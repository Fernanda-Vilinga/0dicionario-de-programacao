import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import MentorDashboard from './MentorDashboardScreen';
import ChatsScreen from './ChatsScreen';
import SettingsScreenMentor from './SettingScreenMentor';
import ProfileMentorScreen from './ProfileMentor';
const Tab = createBottomTabNavigator();

const MentorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Agenda':
              iconName = 'schedule';
              break;
            case 'Mensagens':
              iconName = 'message';
              break;
            case 'Configurações':
              iconName = 'settings';
              break;
             
            
            default:
              iconName = 'schedule';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2979FF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Agenda" component={MentorDashboard} />
      <Tab.Screen name="Mensagens" component={ChatsScreen} />
   
  
    </Tab.Navigator>
  );
};

export default MentorNavigator;
