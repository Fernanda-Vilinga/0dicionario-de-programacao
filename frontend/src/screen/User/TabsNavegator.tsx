import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

// Importando as telas principais


import HomeScreen from "./HomeUser";
import DicionarioHome from "./DicionaryScreen";
import BlocoDeNotasScreen from "./NotesScreen";
import QuizScreen from "./QuizScreen";
import MentoriaScreen from "./MentorShipScreen";

const Tab = createBottomTabNavigator();


const TabsNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = "home";
            } else if (route.name === "Dicionário") {
              iconName = "book";
            } else if (route.name === "Bloco de Notas") {
              iconName = "create";
            } else if (route.name === "Quiz") {
              iconName = "help-circle";
            } else if (route.name === "Mentoria") {
              iconName = "school";
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2979FF",
          tabBarInactiveTintColor: "gray",
          headerShown: false, // O header será personalizado em cada tela
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Dicionário" component={DicionarioHome} />
        <Tab.Screen name="Bloco de Notas" component={BlocoDeNotasScreen} />
        <Tab.Screen name="Quiz" component={QuizScreen} />
        <Tab.Screen name="Mentoria" component={MentoriaScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default TabsNavigator;
