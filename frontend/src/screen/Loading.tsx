import React, { useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../context/ThemeContext'; // Importa o contexto de tema

type RootStackParamList = {
  Loading: undefined;
  LoginRegister: undefined;
};

type NavigationProps = StackNavigationProp<RootStackParamList, 'Loading'>;

const Loading: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const { theme } = useContext(ThemeContext); // Obtém o tema do contexto

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('LoginRegister');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.loadingBox}>
        <View style={styles.iconWrapper}>
          <MaterialIcons name="local-library" size={250} color="#2979FF" />
          <FontAwesome5 
            name="graduation-cap" 
            size={80} 
           color="#2979FF"
            style={styles.capIcon} 
          />
        </View>
        <ActivityIndicator size="large" color="#2979FF" />
        <Text style={[styles.text, { color: theme.textColor }]}>
          Dicionário de Programação
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingBox: {
    padding: 2,
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  iconWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: 250,
    height: 450,
  },
  capIcon: {
    position: "absolute",
    top: 68, 
    left: 76,
  },
});

export default Loading;
