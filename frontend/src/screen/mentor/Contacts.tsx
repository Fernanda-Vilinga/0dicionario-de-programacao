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
      style={styles.contactItem}
      activeOpacity={0.8}
      onPress={() => onSelectContact(item)}
    >
      {/* Profile image or fallback icon, wrapped to open profile */}
      {item.profileImage ? (
        <TouchableOpacity
          onPress={() => onOpenProfile(item.id)}
          style={styles.contactImage}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: item.profileImage }}
            style={styles.contactImage}
            resizeMode="cover"
            onError={(e) => console.warn('Erro carregando imagem:', e.nativeEvent.error)}
          />
        </TouchableOpacity>
      ) : (
        <Ionicons
          name="person-circle"
          size={50}
          color={theme.textColor}
          style={{ marginRight: 14 }}
        />
      )}

      {/* Contact name */}
      <Text
        style={[styles.contactName, { color: theme.textColor }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.name}
      </Text>

      {/* Chevron icon to indicate navigation */}
      <Ionicons name="chevron-forward" size={24} color={theme.primaryColor} />
    </TouchableOpacity>
  ); ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => onSelectContact(item)}
    >
      {/* Profile image or fallback icon, wrapped to open profile */}
      <TouchableOpacity onPress={() => onOpenProfile(item.id)} style={styles.contactImage}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.contactImage} />
        ) : (
          <Ionicons name="person-circle" size={50} color={theme.textColor} />
        )}
      </TouchableOpacity>

      {/* Contact name */}
      <Text
        style={[styles.contactName, { color: theme.textColor }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.name}
      </Text>

      {/* Chevron icon to indicate navigation */}
      <Ionicons name="chevron-forward" size={24} color={theme.primaryColor} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>        
        <ActivityIndicator size="large" color={theme.primaryColor || '#004AAD'} />
        <Text style={[styles.contactName, { color: theme.textColor, marginTop: 8 }]}>Carregando...</Text>
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
        contacts.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' }
      ]}
    />
  );
};

export default Contacts;
