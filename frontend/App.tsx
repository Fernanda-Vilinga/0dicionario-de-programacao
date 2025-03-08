import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";
// Importando as telas
import Loading from "./src/screen/Loading";
import LoginRegisterTabs from "./src/screen/AuthTabsScreen";
import DashboardScreen from "./src/screen/User/HomeUser";
import DicionarioHome from "./src/screen/User/DicionaryScreen";
import QuizScreen from "./src/screen/User/QuizScreen";
import BlocoDeNotasScreen from "./src/screen/User/NotesScreen";
import MentoriaScreen from "./src/screen/User/MentorShipScreen";
import ProfileScreen from "./src/screen/User/ProfileScreen";
import SettingsScreen from "./src/screen/User/SettingsScreen";
import FavoritesScreen from "./src/screen/User/FavoritesScreen";
import SuggestionsScreen from "./src/screen/User/SuggestionsScreen";
import HistoryScreen from "./src/screen/User/HistoryScreen";
import AboutScreen from "./src/screen/User/AboutScreen";
import AdminDashboardScreen from "./src/screen/admin/AdminNavigator";
import MentorNavigator from "./src/screen/mentor/MentorNavigator";
import SugestoesScreen from "./src/screen/admin/SugestoesScreen";
import DetalheNotaScreen from "./src/screen/User/DetalheNotaScreen";
import TabsNavigator from "./src/screen/User/HomeUser"; // Corrigido nome
import { ThemeProvider } from "@react-navigation/native";
import ManageQuestionsScreen from "./src/screen/admin/ManageQuestionsScreen"
// Tipagem das rotas
export type RootStackParamList = {
  Loading: undefined;
  LoginRegister: undefined;
  TabsNavigator: undefined;
  Dashboard: undefined;
  Dicionario: undefined;
  Quiz: undefined;
  BlocoDeNotas: undefined;
  Mentoria: undefined;
  Perfil: undefined;
  Definicoes: undefined;
  Favoritos: undefined;
  Sugestoes: undefined;
  Historico: undefined;
  Sobre: undefined;
  AdminDashboard: undefined;
  MentorNavigator: undefined;
  SugestoesScreen: undefined;
  DetalheNotaScreen: undefined;
  ManageQuestionsScreen: { quizId: string }; // Ajuste aqui
};
const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <ThemeProvider value={DefaultTheme}>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Loading" component={Loading} />
      <Stack.Screen name="LoginRegister" component={LoginRegisterTabs} />
      <Stack.Screen name="TabsNavigator" component={TabsNavigator} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Dicionario" component={DicionarioHome} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="BlocoDeNotas" component={BlocoDeNotasScreen} />
      <Stack.Screen name="Mentoria" component={MentoriaScreen} />
      <Stack.Screen name="Perfil" component={ProfileScreen} />
      <Stack.Screen name="Definicoes" component={SettingsScreen} />
      <Stack.Screen name="Favoritos" component={FavoritesScreen} />
      <Stack.Screen name="Sugestoes" component={SuggestionsScreen} />
      <Stack.Screen name="Historico" component={HistoryScreen} />
      <Stack.Screen name="Sobre" component={AboutScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="MentorNavigator" component={MentorNavigator} />
      <Stack.Screen name="SugestoesScreen" component={SugestoesScreen} />
      <Stack.Screen name="DetalheNotaScreen" component={DetalheNotaScreen} />
    

    </Stack.Navigator>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;
