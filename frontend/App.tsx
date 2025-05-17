import React, { useContext, useMemo, useEffect, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

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
import TabsNavigator from "./src/screen/User/HomeUser";
import ProfileMentorScreen from "./src/screen/mentor/ProfileMentor";
import ManageQuestionsScreen from "./src/screen/admin/ManageQuestionsScreen";
import MentoresScreen from "./src/screen/User/MentoresScreen";
import ChatsScreen from "./src/screen/mentor/ChatsScreen";
import AudioRecorderModal from "./src/screen/mentor/Audio";
import AudioPlayer from "./src/screen/mentor/Player";
import SettingsScreenMentor from "./src/screen/mentor/SettingScreenMentor";
import ListaSessaoScreen from "./src/screen/User/ListarCancelarMentoria";
import UserSessionsScreen from "./src/screen/User/ListarCancelarMentoria";
import NotificationsScreen from "./src/screen/Notifications";
import ChatArea from "./src/screen/mentor/ChatArea";
import SettingsScreenAdmin from "./src/screen/admin/SettingsAdmin";
import ChangePasswordScreen from "./src/screen/ChangePassword";
import ResetPasswordScreen from "./src/screen/ResetPassWord";

import { ThemeContext, ThemeProvider } from "./src/context/ThemeContext";
import { SessaoMentoria } from "./src/types/types";

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
  ManageQuestionsScreen: { quizId: string };
  ProfileMentor: undefined;
  Chat: { sessao: SessaoMentoria };
  Mentores: undefined;
  DefinicoesMentor: undefined;
  ListaSessao: undefined;
  VerSessao: undefined;
  Notifications: undefined;
  DefinicoesAdmin: undefined;
  ChattArea: { sessao: SessaoMentoria };
  ResetPassword: { usuarioId: string };
  ChangePassword: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => (
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
    <Stack.Screen
      name="AdminDashboard"
      component={AdminDashboardScreen}
    />
    <Stack.Screen
      name="MentorNavigator"
      component={MentorNavigator}
    />
    <Stack.Screen
      name="SugestoesScreen"
      component={SugestoesScreen}
    />
    <Stack.Screen
      name="DetalheNotaScreen"
      component={DetalheNotaScreen}
    />
    <Stack.Screen name="Mentores" component={MentoresScreen} />
    <Stack.Screen name="ProfileMentor" component={ProfileMentorScreen} />
    <Stack.Screen name="Chat" component={ChatsScreen} />
    <Stack.Screen
      name="ListaSessao"
      component={ListaSessaoScreen}
    />
    <Stack.Screen
      name="VerSessao"
      component={UserSessionsScreen}
    />
    <Stack.Screen
      name="DefinicoesAdmin"
      component={SettingsScreenAdmin}
    />
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
    />
    <Stack.Screen
      name="ResetPassword"
      component={ResetPasswordScreen}
    />
    <Stack.Screen
      name="ChangePassword"
      component={ChangePasswordScreen}
    />
  </Stack.Navigator>
);

const AppContent = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("usuarioId")
      .then((id) => {
        if (id) setUsuarioId(id);
        else Alert.alert("Erro", "Usuário não identificado.");
      })
      .catch((error) =>
        console.error("Erro ao ler AsyncStorage:", error)
      );
  }, []);

  const navigationTheme = useMemo(
    () => ({
      dark: isDarkMode,
      colors: {
        primary: "#2979FF",
        background: isDarkMode ? "#121212" : "#f5f5f5",
        card: isDarkMode ? "#1F1F1F" : "#ffffff",
        text: isDarkMode ? "#f5f5f5" : "#333333",
        border: isDarkMode ? "#333333" : "#e0e0e0",
        notification: "#2979FF",
      },
      fonts: DefaultTheme.fonts,
    }),
    [isDarkMode]
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: navigationTheme.colors.background,
      }}
    >
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
};

const App = () => (
  <ThemeProvider>
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  </ThemeProvider>
);

export default App;
