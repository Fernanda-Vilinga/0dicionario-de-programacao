import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import HeaderComum from '../HeaderComum'
const ReportsScreen = () => {
  return (
    <ScrollView style={styles.container}>
          <View style={styles.header}>
        <HeaderComum  screenName="Relatórios de Atividades"/>
                </View>
  
      

      <Text style={styles.reportTitle}>Relatório de Usuários Ativos</Text>
      <Text style={styles.reportText}>Total de usuários ativos: 150</Text>

      <Text style={styles.reportTitle}>Relatório de Vendas</Text>
      <Text style={styles.reportText}>Total de vendas: R$5000</Text>

      <Text style={styles.reportTitle}>Relatório de Acesso</Text>
      <Text style={styles.reportText}>Usuários acessando mais: João, Maria, etc.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  reportTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  reportText: { fontSize: 16, marginVertical: 5 },  header: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  }
});

export default ReportsScreen;
