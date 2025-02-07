import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList ,Dimensions } from 'react-native';
import HeaderComum from '../HeaderComum'

const { width } = Dimensions.get('window');
const areasMentoria = [
  { id: '1', nome: 'Algoritmo e Lógica de Programação' },
  { id: '2', nome: 'Desenvolvimento Web', subareas: ['Frontend', 'Backend', 'Fullstack'] },
  { id: '3', nome: 'Desenvolvimento Mobile', subareas: ['Frontend', 'Backend', 'Fullstack'] },
  { id: '4', nome: 'Design - UI/UX' },
  { id: '5', nome: 'Inteligência Artificial' },
  { id: '6', nome: 'Machine Learning' },
];

const MentoriaScreen: React.FC = () => {
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null);
  const [subareaSelecionada, setSubareaSelecionada] = useState<string | null>(null);

  const selecionarArea = (area: string) => {
    setAreaSelecionada(area);
    setSubareaSelecionada(null); // Resetar a subárea ao mudar de área
  };

  const selecionarSubarea = (subarea: string) => {
    setSubareaSelecionada(subarea);
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <HeaderComum screenName='Mentoria' />
        </View>
      <Text style={styles.titulo}>Escolha uma área para a mentoria</Text>

      <FlatList
        data={areasMentoria}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <View style={styles.list} >
          <TouchableOpacity style={styles.botao} onPress={() => selecionarArea(item.nome)}>
            <Text style={styles.textoBotao}>{item.nome}</Text>
          </TouchableOpacity>
          </View>
        )}
      />

      {areaSelecionada && areasMentoria.find(a => a.nome === areaSelecionada)?.subareas && (
        <View style={styles.subareaContainer}>
          <Text style={styles.subtitulo}>Escolha uma subárea:</Text>
          {areasMentoria.find(a => a.nome === areaSelecionada)?.subareas?.map((sub) => (
            <TouchableOpacity key={sub} style={styles.botao} onPress={() => selecionarSubarea(sub)}>
              <Text style={styles.textoBotao}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {areaSelecionada && (
        <View style={styles.selecaoContainer}>
          <Text style={styles.selecaoTexto}>
            Área selecionada: {areaSelecionada} {subareaSelecionada ? ` - ${subareaSelecionada}` : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    marginTop:10
  },
  list:{
alignItems:'center'
  },
  botao: {
    backgroundColor: '#2979FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    width: width * 0.4,
    alignContent:'center'
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subareaContainer: {
    marginTop: 20,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  selecaoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
  },
  selecaoTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header:{
    flex:1,
    backgroundColor:'#f5f5f5'
  }
});

export default MentoriaScreen;
