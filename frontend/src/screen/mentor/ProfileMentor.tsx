import React, { useState, useEffect, useRef, useContext } from "react";
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

// Define tecnologias por stack de forma genérica
const stackTechnologies: Record<string, string> = {
  "Front-end Developer": "JavaScript, React, TypeScript, Chakra UI, Figma",
  "Back-end Developer": "Node.js, Express, MongoDB, PostgreSQL, Firebase",
  "Full-stack Developer": "React, Node.js, TypeScript, Firebase, GitHub",
  "Mobile Developer": "React Native, Expo, Firebase, TypeScript",
  "DevOps Engineer": "Docker, Kubernetes, AWS, Terraform",
  "Data Scientist": "Python, Pandas, TensorFlow, SQL",
  "Machine Learning Engineer": "Python, TensorFlow, PyTorch, Scikit-learn",
  "Cybersecurity Specialist": "Linux, Kali, Metasploit, Firewalls",
  "Game Developer": "Unity, C#, Unreal Engine, Godot",
  "Cloud Engineer": "AWS, Google Cloud, Azure, Kubernetes",
};

const ProfileMentorScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [userData, setUserData] = useState({
    nome: "",
    stack: "",
    profileImage: "",
    sobre: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<TextInput>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("usuarioId");
        if (storedUserId) setUserId(storedUserId);
        else throw new Error("ID do usuário não encontrado.");
      } catch {
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
        if (!response.ok) throw new Error();
        const data = await response.json();
        setUserData(data);
      } catch {
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
    if (!result.canceled && result.assets.length) {
      setUserData((prev) => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  const generateSobreText = () => {
    const tech = stackTechnologies[userData.stack] || "Tecnologias não especificadas";
    return `Formado(a) como ${userData.stack}, utilizando tecnologias como ${tech}.`;
  };

  const saveProfile = async () => {
    if (!userId || !userData.nome || !userData.stack) {
      Alert.alert("Erro", "Preencha todos os campos antes de salvar.");
      return;
    }
    try {
      setSaving(true);
      const updated = { ...userData, sobre: generateSobreText() };
      const res = await fetch(`${API_BASE_URL}/perfil/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch {
      Alert.alert("Erro", "Falha ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.backgroundColor }]}>  
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>      
      <HeaderComum screenName="Perfil" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          <Image
            source={{ uri: userData.profileImage || theme.placeholderTextColor }}
            style={styles.profileImage}
          />
          <Ionicons
            name="camera"
            size={24}
            color={theme.buttonText}
            style={[styles.cameraIcon, { backgroundColor: theme.primaryColor }]}
          />
        </TouchableOpacity>
        <View style={styles.fieldContainer}>
          <Ionicons name="person-outline" size={20} color={theme.primaryColor} />
          <TextInput
            ref={nameInputRef}
            style={[styles.input, { borderBottomColor: theme.borderColor, color: theme.textColor }]}
            placeholder="Nome"
            placeholderTextColor={theme.placeholderTextColor}
            value={userData.nome}
            onChangeText={(text) => setUserData((prev) => ({ ...prev, nome: text }))}
          />
        </View>
        <View style={styles.fieldContainer}>
          <MaterialIcons name="computer" size={20} color={theme.primaryColor} />
          <Picker
            selectedValue={userData.stack}
            onValueChange={(val) => setUserData((prev) => ({ ...prev, stack: val }))}
            style={[styles.picker, { color: theme.textColor }, { backgroundColor: theme.backgroundColor }]}
            dropdownIconColor={theme.primaryColor}
          >
            {Object.keys(stackTechnologies).map((stack) => (
              <Picker.Item key={stack} label={stack} value={stack} />
            ))}
          </Picker>
        </View>
        <Text style={[styles.sobreText, { color: theme.textColorSecondary }]}>          
          {generateSobreText()}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.buttonBackground }]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.buttonText }]}>              
              Salvar
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 16, alignItems: "center" },
  imageContainer: { position: "relative", marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  cameraIcon: { position: "absolute", bottom: 0, right: 0, padding: 6, borderRadius: 15 },
  fieldContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, width: "100%" },
  input: { flex: 1, fontSize: 18, marginLeft: 10, paddingVertical: 4 },
  picker: { flex: 1, marginLeft: 10 },
  saveButton: { padding: 12, borderRadius: 8, width: "80%", alignItems: "center" },
  saveButtonText: { fontSize: 16, fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  sobreText: { fontSize: 16, textAlign: "center", marginVertical: 10, paddingHorizontal: 20 },
});

export default ProfileMentorScreen;