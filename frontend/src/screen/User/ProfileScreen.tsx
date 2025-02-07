import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Usando ícones do Expo para editar
import HeaderComum from '../HeaderComum';

const ProfileScreen = () => {
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);

  const [name, setName] = useState('Lúcia Bélsia ');
  const [bio, setBio] = useState('Amo ser dev !');

  const handleEditImage = () => {
    setIsEditingImage(true); // Apenas um exemplo
  };

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleEditBio = () => {
    setIsEditingBio(true);
  };

  return (
    <View>
      <View style={styles.header}>
        <HeaderComum screenName="Perfil" />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Imagem do usuário */}
        <TouchableOpacity onPress={handleEditImage}>
          <Image
            source={{
              uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSonST6m2GSBkDd62aOpvXKFXzDQ-j4ss5-U9OBJPK-Fyqu8YA&s/150',
            }}
            style={styles.profileImage}
          />
          <Ionicons
            name="camera"
            size={30}
            color="white"
            style={styles.cameraIcon}
          />
        </TouchableOpacity>

        {/* Nome do usuário */}
        <View style={styles.fieldContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-outline" size={24} color="gray" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.fieldLabel}>Nome</Text>
            {isEditingName ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoFocus
                onBlur={() => setIsEditingName(false)}
              />
            ) : (
              <Text style={styles.name}>{name}</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleEditName}>
            <Ionicons name="pencil" size={24} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Biografia */}
        <View style={styles.fieldContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="information-circle-outline" size={24} color="gray" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.fieldLabel}>Biografia</Text>
            {isEditingBio ? (
              <TextInput
                style={[styles.input, styles.bio]}
                value={bio}
                onChangeText={setBio}
                multiline
                onBlur={() => setIsEditingBio(false)}
              />
            ) : (
              <Text style={styles.bioText}>{bio}</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleEditBio}>
            <Ionicons name="pencil" size={24} color="gray" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100, // Tornando a imagem circular
    marginBottom: 20,
    marginTop: 40,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#004AAD', // Azul cobalto (cor da sua app)
    borderRadius: 50,
    padding: 8,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '80%',
  },
  iconContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#888',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    fontSize: 18,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  bio: {
    height: 120,
  },
  bioText: {
    fontSize: 16,
    color: '#555',
  },
  header: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default ProfileScreen;
