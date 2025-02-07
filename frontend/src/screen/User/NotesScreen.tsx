import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet ,Dimensions} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderComum from '../HeaderComum'

const { width } = Dimensions.get('window');
interface Nota {
  id: string;
  conteudo: string;
  favorita: boolean;
}

const BlocoDeNotasScreen = () => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [novaNota, setNovaNota] = useState('');

  const adicionarNota = () => {
    if (novaNota.trim() === '') return;
    const nova: Nota = {
      id: Math.random().toString(),
      conteudo: novaNota,
      favorita: false,
    };
    setNotas([...notas, nova]);
    setNovaNota('');
  };

  const alternarFavorito = (id: string) => {
    setNotas(notas.map(nota => 
      nota.id === id ? { ...nota, favorita: !nota.favorita } : nota
    ));
  };

  const removerNota = (id: string) => {
    setNotas(notas.filter(nota => nota.id !== id));
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
<HeaderComum screenName='Bloco de notas ' />
        </View>
      <Text style={styles.titulo}>Lista de anotações</Text>
      <TextInput
        style={styles.input}
        placeholder="Pesquisar anotação..."
        value={novaNota}
        onChangeText={setNovaNota}
      />
      <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionarNota}>
        <Text style={styles.textoBotao}>+</Text>
      </TouchableOpacity>
      <FlatList
        data={notas}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.notaContainer}>
            <Text style={styles.notaTexto}>{item.conteudo}</Text>
            <View style={styles.icones}>
              <TouchableOpacity onPress={() => alternarFavorito(item.id)}>
                <MaterialIcons name={item.favorita ? 'favorite' : 'favorite-border'} size={24} color="red" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removerNota(item.id)}>
                <MaterialIcons name="delete" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    width: width * 0.8,
  },
  botaoAdicionar: {
    backgroundColor: '#2979FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width:70
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  notaTexto: {
    flex: 1,
    fontSize: 16,
  },
  icones: {
    flexDirection: 'row',
    gap: 10,
  },
  header:{
    flex:1 ,
    backgroundColor:'#f5f5f5'
  }
});

export default BlocoDeNotasScreen;
