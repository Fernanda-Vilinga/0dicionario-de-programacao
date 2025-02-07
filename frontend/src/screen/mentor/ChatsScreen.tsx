import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import HeaderComum from '../HeaderComum'

const ChatsScreen = () => {
  

  return (
    <View >
       <View style={styles.header}>
        <HeaderComum screenName="Definições" />
      </View>
      <View style={styles.container}>
      <Text style={styles.title}>Descarregando conversas ... 12%</Text>

    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 ,textAlign: 'center'},
  settingText: { fontSize: 18, marginVertical: 10 },
  button: { backgroundColor: '#2979FF', padding: 15, borderRadius: 5, marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },  header:{
    flex:1 ,
    backgroundColor:'#f5f5f5'
  }
});

export default ChatsScreen;
