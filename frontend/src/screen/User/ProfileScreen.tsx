import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import API_BASE_URL from "src/config";
import HeaderComum from "../HeaderComum";
import { ThemeContext } from "src/context/ThemeContext";

interface UserProfile {
  nome: string;
  bio: string;
  profileImage: string;
}

const bioOptions = [
  "Estudante de programação",
  "Desenvolvedor iniciante",
  "Desenvolvedora iniciante",
  "Amante de tecnologia",
  "Aprendendo React Native",
  "Futuro engenheiro de software",
  "Futura engenheira de software",
  "Entusiasta de código aberto",
  "Construindo meu primeiro app",
  "Explorador do mundo digital",
  "Exploradora do mundo digital",
  "Iniciando na programação",
  "Curioso sobre desenvolvimento",
  "Curiosa sobre desenvolvimento",
  "Apaixonado por lógica de programação",
  "Criando projetos incríveis",
  "Buscando minha primeira vaga tech",
  "Estudando novas linguagens",
  "Aspirante a full-stack developer",
];

const ProfileScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [userData, setUserData] = useState<UserProfile>({
    nome: "",
    bio: "",
    profileImage: "",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("usuarioId");
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          throw new Error("ID do usuário não encontrado.");
        }
      } catch (err) {
        Alert.alert("Erro", "Falha ao obter ID do usuário.");
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/perfil/${userId}`);
        if (!response.ok)
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        Alert.alert("Erro", "Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso às fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets.length) return;

    const imageUri = result.assets[0].uri;
    setUserData((prev) => ({ ...prev, profileImage: imageUri }));
  };

  const saveProfile = async () => {
    if (!userId || !userData.nome || !userData.bio) {
      Alert.alert("Erro", "Preencha todos os campos antes de salvar.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/perfil/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error("Erro ao salvar perfil.");

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (err) {
      Alert.alert("Erro", "Falha ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: theme.backgroundColor,
      },
      scrollContainer: {
        flexGrow: 1,
        padding: 16,
        alignItems: "center",
      },
      imageContainer: { 
        position: "relative", 
        marginBottom: 20,
      },
      profileImage: { 
        width: 120, 
        height: 120, 
        borderRadius: 60,
      },
      cameraIcon: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: theme.buttonBackground,
        padding: 6,
        borderRadius: 15,
      },
      fieldContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        width: "100%",
      },
      input: {
        flex: 1,
        fontSize: 18,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderColor,
        marginLeft: 10,
        color: theme.textColor,
      },
      saveButton: {
        backgroundColor: theme.buttonBackground,
        padding: 12,
        borderRadius: 8,
        width: "80%",
        alignItems: "center",
      },
      saveButtonText: {
        color: theme.buttonText,
        fontSize: 16,
        fontWeight: "bold",
      },
      picker: {
        flex: 1,
        marginLeft: 10,
        color: theme.textColor,
        backgroundColor: theme.cardBackground, // Adicionado para alterar o fundo do Picker
      },
      iconRight: { 
        marginLeft: 8 
      },
      center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
    });
  }, [theme]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Perfil" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          <Image
            source={{
              uri:
                userData.profileImage ||
                "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
            }}
            style={styles.profileImage}
          />
          <Ionicons
            name="camera"
            size={24}
            color="white"
            style={styles.cameraIcon}
          />
        </TouchableOpacity>

        <View style={styles.fieldContainer}>
          <Ionicons name="person-outline" size={20} color={theme.buttonBackground} />
          <TextInput
            ref={nameInputRef}
            style={styles.input}
            placeholder="Nome"
            placeholderTextColor={theme.placeholderTextColor}
            value={userData.nome}
            onChangeText={(text) =>
              setUserData((prev) => ({ ...prev, nome: text }))
            }
          />
          <TouchableOpacity onPress={() => nameInputRef.current?.focus()}>
            <MaterialIcons name="edit" size={20} color={theme.buttonBackground} style={styles.iconRight} />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <MaterialIcons name="info-outline" size={20} color={theme.buttonBackground} />
          <Picker
            selectedValue={userData.bio}
            onValueChange={(itemValue) =>
              setUserData((prev) => ({ ...prev, bio: itemValue }))
            }
            style={styles.picker}
            dropdownIconColor={theme.textColor}
          >
            {bioOptions.map((bio, index) => (
              <Picker.Item key={index} label={bio} value={bio} />
            ))}
          </Picker>
          <MaterialIcons name="edit" size={20} color={theme.buttonBackground} style={styles.iconRight} />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
