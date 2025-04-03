// Contacts.tsx
import React from 'react';
import { FlatList, TouchableOpacity, Image, Text, Alert } from 'react-native';
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

const Contacts: React.FC<ContactsProps> = ({
  contacts,
  loading,
  onSelectContact,
  onOpenProfile,
}) => {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);

  const renderItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => onSelectContact(item)}
    >
      {item.profileImage ? (
        // Ao clicar na imagem, abre o modal do perfil
        <TouchableOpacity onPress={() => onOpenProfile(item.id)}>
          <Image source={{ uri: item.profileImage }} style={styles.contactImage} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="person-circle" size={40} color={theme.textColor} />
      )}
      <Text style={[styles.contactName, { color: theme.textColor }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={contacts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.contactsList}
    />
  );
};

export default Contacts;
