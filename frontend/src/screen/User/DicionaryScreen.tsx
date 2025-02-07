import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet , Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderComum from '../HeaderComum'

const { width } = Dimensions.get('window');
const DicionarioHome = () => {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);

  const categorias = ['Front-end', 'Back-end', 'Banco de Dados', 'Segurança', 'Cloud'];

  const pesquisarTermo = async () => {
    try {
      let url = `https://seu-servidor.com/dicionario/termos?termo=${termo}`;
      if (categoria) url += `&categoria=${categoria}`;

      const response = await fetch(url);
      const data = await response.json();
      setResultados(data);
    } catch (error) {
      console.error('Erro ao buscar termo:', error);
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
<HeaderComum  screenName="Dicionário"/>
        </View>
      <Text style={styles.title}>Enriqueça o teu vocabulário</Text>
      <View style={styles.containerText}>
      <Text style={styles.searchText}>Pesquisa geral </Text>
      <Text style={styles.searchText2}>Termos de Programação </Text>
      </View>
      <View style={styles.containerSearch}>
      <TouchableOpacity style={styles.searchButton} onPress={pesquisarTermo}>
      <MaterialIcons name="search" size={24} color="black" />
    <TextInput placeholder='Pesquisar...'  style={styles.TextInput}   />
    
      </TouchableOpacity>
      <TouchableOpacity style={styles.searchButtonCategoria} onPress={pesquisarTermo}>
        <Text style={styles.searchText4}>Pesquisar por categoria</Text>
      </TouchableOpacity>
      </View>
      {/* Filtro de Categoria */}
  

      {/* Resultados */}
      <FlatList
        data={resultados}
        keyExtractor={(item) => item.termo}
        renderItem={({ item }) => (
          <View style={styles.resultCard}>
            <Text style={styles.term}>{item.termo}</Text>
            <Text style={styles.definition}>{item.definicao}</Text>
            <Text style={styles.language}>Linguagem: {item.linguagem || 'N/A'}</Text>
            <Text style={styles.example}>Exemplo: {item.exemplos?.[0] || 'N/A'}</Text>
            <TouchableOpacity>
              <MaterialIcons name="favorite-border" size={24} color="red" />
            </TouchableOpacity>
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
      backgroundColor: '#f5f5f5' 
    },
    containerText:{
flex:1,
alignItems:'flex-start' ,
marginLeft:50
    },
    containerSearch:{
       
        marginLeft:300,
        flexDirection:'row',
       alignContent:'center' ,
       
            },
  title: { 
    fontSize: 22,
     fontWeight: 'bold', 
     color: 'black',
      textAlign: 'center', 
      marginBottom: 10
     },
  input: { 
    backgroundColor: 'white', 
    padding: 10, 
    borderRadius: 5, 
    marginBottom: 10,
   
 },
  searchButton: {
     flexDirection: 'row',
       backgroundColor: '#E0E3E7', 
    paddingTop:10,
        borderRadius: 5, 
        paddingLeft:6,
        width: width * 0.3
    },
    TextInput: {
    
      borderRadius: 5, 
      paddingLeft:6,
      marginRight:10,
         width: width * 0.3,
         
     },
    searchButtonCategoria: {
        flexDirection: 'row',
         alignItems: 'center',
          backgroundColor: '#2979FF', 
          padding: 10,
           borderRadius: 5, 
           justifyContent: 'center' ,
           width: width * 0.2 ,
          
       },
  searchText: { 
    color: 'black', 
    marginLeft: 5  ,
    fontFamily:'Primary Family',
    fontSize:24,
    marginTop:10
},
searchText2: { 
    color: 'black', 
    marginLeft: 5 ,
    fontFamily:'Secondary Family',
    fontSize:14,
    marginTop:10
},
searchText3: { 
    color: 'black', 

},
searchText4: { 
    color: 'white', 

},
  categoryButton: {
     backgroundColor: '#E3F2FD',
     padding: 10, borderRadius: 5,
      marginRight: 5 
    },
  activeCategory: {
     backgroundColor: '#2979FF'
     },
  categoryText: { 
    color: '#333' 

  },
  resultCard: { backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 8,
     marginVertical: 5, 
     elevation: 3 
    },
  term: { fontSize: 18,
     fontWeight: 'bold', 
     color: '#2979FF' },
  definition: { 
    fontSize: 14, color: '#333'

   },
  language: {
     fontSize: 12,
     color: '#777' 

  },
  example: {
     fontSize: 12, 
    fontStyle: 'italic', 
    color: '#555' 

  },
  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },


});

export default DicionarioHome;
