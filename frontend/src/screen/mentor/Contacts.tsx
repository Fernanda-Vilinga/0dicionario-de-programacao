import React, { useContext } from 'react';
import { FlatList, TouchableOpacity, Image, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useStyles from './StylesChat';
import { ThemeContext } from 'src/context/ThemeContext';

export interface Contact {
  id: string;
  name: string;
  profileImage?: string;
}

interface ContactsProps {
  contacts: Contact[];
  loading: boolean;
  onSelectContact: (contact: Contact) => void;
  onOpenProfile: (contactId: string) => void;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, loading, onSelectContact, onOpenProfile }) => {
  const { theme } = useContext(ThemeContext);
  const styles = useStyles();

  const renderItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={[styles.contactItem, { backgroundColor: theme.cardBackground }]}
      onPress={() => onSelectContact(item)}
    >
      {item.profileImage ? (
        <TouchableOpacity onPress={() => onOpenProfile(item.id)}>
          <Image source={{ uri: item.profileImage }} style={styles.contactImage} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="person-circle" size={40} color={theme.textColor} />
      )}
      <Text style={[styles.contactName, { color: theme.textColor }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.primaryColor || '#004AAD'} />
        
      <Text style={[styles.contactName, { color: theme.textColor }]}>Carregando...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={contacts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={[
        styles.contactsList,
        { backgroundColor: theme.backgroundColor },
        contacts.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' }, // evitar tela vazia "seca"
      ]}
    />
  );
};

export default Contacts;
