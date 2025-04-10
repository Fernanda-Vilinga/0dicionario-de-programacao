import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import HeaderComum from '../HeaderComum';

const SobreScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <HeaderComum screenName="Sobre" />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sobre o Aplicativo</Text>

        <Text style={styles.text}>
          O <Text style={styles.bold}>Dicionário de Programação</Text> foi criado para facilitar a vida de estudantes e profissionais de TI,
          reunindo em um só lugar conteúdos teóricos, ferramentas práticas e suporte especializado.
        </Text>

        <Text style={styles.text}>
          Com este app, você pode:
        </Text>

        <Text style={styles.text}>
          • Explorar um <Text style={styles.bold}>dicionário técnico</Text> com termos essenciais da programação;{"\n"}
          • Testar seus conhecimentos com <Text style={styles.bold}>quizzes interativos</Text>;{"\n"}
          • Registrar ideias no <Text style={styles.bold}>bloco de notas</Text>;{"\n"}
          • Participar de <Text style={styles.bold}>sessões de mentoria</Text> com especialistas em tecnologia.
        </Text>

        <Text style={styles.text}>
          Nosso objetivo é tornar o aprendizado mais integrado, acessível e eficaz, principalmente para quem está dando
          os primeiros passos na área.
        </Text>

        <Text style={styles.subtitle}>Suporte Técnico</Text>
        <Text style={styles.text}>
          Em caso de dúvidas ou dificuldades, entre em contato com a nossa equipe pelo e-mail:
        </Text>
        <Text style={styles.email}>appDicionarioProgramacao01@gmail.com</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'black',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
    color: '#004AAD',
  },
  text: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  email: {
    fontSize: 16,
    color: '#004AAD',
    fontWeight: 'bold',
    marginBottom: 30,
  },
});

export default SobreScreen;
