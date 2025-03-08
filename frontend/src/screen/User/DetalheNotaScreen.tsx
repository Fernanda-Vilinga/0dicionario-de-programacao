import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderComum from '../HeaderComum';

const DetalheNotaScreen = ({ route, navigation }: any) => {
  const { nota } = route.params;

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Detalhe da Nota" />



      <Text style={styles.titulo}>{nota.tags?.join(', ') || 'Sem título'}</Text>
      <Text style={styles.descricao}>{nota.conteudo}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#004AAD' },
  descricao: { fontSize: 18, color: '#555', marginBottom: 20, textAlign: 'justify' },
  botaoVoltar: { 
    flexDirection: 'row', 
    backgroundColor: '#2979FF', 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center', 
    alignSelf: 'flex-start',
    marginBottom: 15
  },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default DetalheNotaScreen;
