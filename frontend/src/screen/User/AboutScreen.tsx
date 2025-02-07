import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HeaderComum from '../HeaderComum'
const SobreScreen = () => {
  return (
    <View >
       <View style={styles.header}>
        <HeaderComum  screenName="Sobre"/>
                </View>
                <View style={styles.container}>
      <Text style={styles.title}>Sobre nossa App</Text>
      <Text style={styles.text}>Este aplicativo foi desenvolvido para ajudar programadores a expandir 
         vocabulário, testar seus conhecimentos com quizzes, e conectar-se com mentores na área de tecnologia.</Text>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent:'center',
    alignItems:'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  text: {
    fontSize: 16,
    color: '#555',
  },
  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default SobreScreen;
