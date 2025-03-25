import React, { useState, useEffect, useRef } from "react";
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

const stackTechnologies = {
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
  const [userData, setUserData] = useState({
    nome: "",
    stack: "",
    profileImage: "",
    sobre: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("usuarioId");
        if (storedUserId) setUserId(storedUserId);
        else throw new Error("ID do usuário não encontrado.");
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
        if (!response.ok) throw new Error("Erro ao carregar perfil.");
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
    if (!result.canceled && result.assets.length) {
      setUserData((prev) => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };
  const generateSobreText = () => {
    const tecnologias = stackTechnologies[userData.stack as keyof typeof stackTechnologies] || "Tecnologias não especificadas";
    return `Formado(a) como ${userData.stack}, utilizando tecnologias como ${tecnologias}.`;
  };
  

  const saveProfile = async () => {
    if (!userId || !userData.nome || !userData.stack) {
      Alert.alert("Erro", "Preencha todos os campos antes de salvar.");
      return;
    }
    try {
      setSaving(true);
      const updatedUserData = { ...userData, sobre: generateSobreText() };
      const response = await fetch(`${API_BASE_URL}/perfil/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserData),
      });
      if (!response.ok) throw new Error("Erro ao salvar perfil.");
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (err) {
      Alert.alert("Erro", "Falha ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#004AAD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderComum screenName="Perfil" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          <Image source={{ uri: userData.profileImage || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png" }} style={styles.profileImage} />
          <Ionicons name="camera" size={24} color="white" style={styles.cameraIcon} />
        </TouchableOpacity>
        <View style={styles.fieldContainer}>
          <Ionicons name="person-outline" size={20} color="#004AAD" />
          <TextInput ref={nameInputRef} style={styles.input} placeholder="Nome" value={userData.nome} onChangeText={(text) => setUserData((prev) => ({ ...prev, nome: text }))} />
        </View>
        <View style={styles.fieldContainer}>
          <MaterialIcons name="computer" size={20} color="#004AAD" />
          <Picker selectedValue={userData.stack} onValueChange={(itemValue) => setUserData((prev) => ({ ...prev, stack: itemValue }))} style={styles.picker}>
            {Object.keys(stackTechnologies).map((stack, index) => (
              <Picker.Item key={index} label={stack} value={stack} />
            ))}
          </Picker>
        </View>
        <Text style={styles.sobreText}>{generateSobreText()}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContainer: { flexGrow: 1, padding: 16, alignItems: "center" },
  imageContainer: { position: "relative", marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  cameraIcon: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#004AAD", padding: 6, borderRadius: 15 },
  fieldContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, width: "100%" },
  input: { flex: 1, fontSize: 18, borderBottomWidth: 1, borderBottomColor: "#ccc", marginLeft: 10 },
  saveButton: { backgroundColor: "#004AAD", padding: 12, borderRadius: 8, width: "80%", alignItems: "center" },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  picker: { flex: 1, marginLeft: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  iconRight: { marginLeft: 8 },sobreText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginVertical: 10,
    paddingHorizontal: 20,
  },

});


export default ProfileMentorScreen;
