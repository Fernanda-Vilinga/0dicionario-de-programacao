import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import API_BASE_URL from 'src/config';
import HeaderComum from '../HeaderComum';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MaterialIconName = "code" | "cached" | "developer-mode" | "storage" | "cloud";

interface Category {
  name: string;
  icon: MaterialIconName;
}

interface QuizQuestion {
  id: string;
  pergunta: string;
  opcoes: string[];
  respostaCorreta: number;
  categoria: string;
  date: string;
}

interface RespostaQuiz {
  idPergunta: string;
  respostaDada: string;
  correta: boolean;
}

const QuizScreen: React.FC = () => {
  // Para este exemplo, usaremos um usuário fixo.
  // Na prática, obtenha esse valor do contexto de autenticação ou AsyncStorage.
  const usuarioId = "user123";

  const [mode, setMode] = useState<'menu' | 'quiz' | 'result'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<RespostaQuiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showQuitModal, setShowQuitModal] = useState(false);

  // Estado dinâmico para os status dos quizzes (persistente, atrelado ao usuário)
  const [quizStatus, setQuizStatus] = useState<{ [key: string]: "completed" | "inProgress" | "notStarted" }>({
    "Desenvolvimento Web": "notStarted",
    "Desenvolvimento Mobile": "notStarted",
    "Ciência de Dados": "notStarted",
    "DevOps & Infraestrutura": "notStarted",
    "Desenvolvimento de Jogos": "notStarted",
    "Programação de Sistemas": "notStarted",
  });

  const categories: Category[] = [
    { name: "Desenvolvimento Web", icon: "code" },
    { name: "Desenvolvimento Mobile", icon: "developer-mode" },
    { name: "Ciência de Dados", icon: "storage" },
    { name: "DevOps & Infraestrutura", icon: "cloud" },
    { name: "Desenvolvimento de Jogos", icon: "cached" },
    { name: "Programação de Sistemas", icon: "code" },
  ];

  // Carrega o estado persistido (local) – opcional para o quizStatus local
  useEffect(() => {
    const loadLocalQuizStatus = async () => {
      try {
        const storedStatus = await AsyncStorage.getItem(`quizStatus_${usuarioId}`);
        if (storedStatus !== null) {
          setQuizStatus(JSON.parse(storedStatus));
        }
      } catch (error) {
        console.error('Erro ao carregar o status local dos quizzes:', error);
      }
    };
    loadLocalQuizStatus();
  }, [usuarioId]);

  // Persiste o estado local sempre que quizStatus for atualizado
  useEffect(() => {
    const persistLocalQuizStatus = async () => {
      try {
        await AsyncStorage.setItem(`quizStatus_${usuarioId}`, JSON.stringify(quizStatus));
      } catch (error) {
        console.error('Erro ao persistir o status local dos quizzes:', error);
      }
    };
    persistLocalQuizStatus();
  }, [quizStatus, usuarioId]);

  // Garante que o índice atual seja válido quando as perguntas forem carregadas
  useEffect(() => {
    if (!loading && questions.length > 0 && currentQuestionIndex >= questions.length) {
      setCurrentQuestionIndex(0);
    }
  }, [questions, loading, currentQuestionIndex]);

  // useEffect para atualizar o progresso no backend quando o quiz está em andamento
  useEffect(() => {
    if (mode === 'quiz' && selectedCategory) {
      updateQuizProgress();
    }
  }, [currentQuestionIndex, score, mode, selectedCategory]);

  const getStatusText = (status: string) => {
    if (status === "completed") return "Concluído";
    if (status === "inProgress") return "Em andamento";
    return "Não iniciado";
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "#4CAF50";
    if (status === "inProgress") return "#FF9800";
    return "#9E9E9E";
  };

  // Atualiza o estado local do quizStatus
  const updateQuizStatusLocal = (categoria: string, status: "completed" | "inProgress" | "notStarted") => {
    setQuizStatus(prevStatus => ({ ...prevStatus, [categoria]: status }));
  };

  // Carrega o progresso do quiz (GET /quiz/progress)
  const loadQuizProgress = async (categoria: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/quiz/progress?usuarioId=${usuarioId}&categoria=${encodeURIComponent(categoria)}`);
      const data = await res.json();
      if (data && data.progress) {
        // Define o índice atual e a pontuação se houver progresso
        setCurrentQuestionIndex(data.progress.currentQuestionIndex || 0);
        setScore(data.progress.score || 0);
        updateQuizStatusLocal(categoria, data.progress.progresso);
      }
    } catch (error) {
      console.error("Erro ao carregar progresso do quiz:", error);
    }
  };

  // Atualiza o progresso do quiz no backend (POST /quiz/progress)
  const updateQuizProgress = async () => {
    try {
      const payload = {
        usuarioId,
        categoria: selectedCategory,
        progresso: quizStatus[selectedCategory] || "notStarted",
        currentQuestionIndex,
        score: score || 0,
      };
      await fetch(`${API_BASE_URL}/quiz/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Erro ao atualizar progresso do quiz:", error);
    }
  };

  const fetchQuestions = async (categoria: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/perguntas?categoria=${encodeURIComponent(categoria)}`);
      const data: QuizQuestion[] = await response.json();
      if (data.length === 0) {
        Alert.alert('Atenção', 'Nenhuma pergunta encontrada para esta categoria.');
      }
      setQuestions(data);
      // Se o progresso salvo estiver fora do intervalo, reinicia o índice
      setCurrentQuestionIndex(0);
      setResponses([]);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar as perguntas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (categoria: string) => {
    setSelectedCategory(categoria);
    updateQuizStatusLocal(categoria, "inProgress");
    fetchQuestions(categoria);
    // Tenta carregar o progresso salvo do backend para esta categoria
    loadQuizProgress(categoria);
    setMode('quiz');
  };

  const handleSelectAnswer = (selectedIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedIndex === currentQuestion.respostaCorreta) {
      const resposta: RespostaQuiz = {
        idPergunta: currentQuestion.id,
        respostaDada: currentQuestion.opcoes[selectedIndex],
        correta: true,
      };
      setResponses(prev => [...prev, resposta]);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        submitQuiz();
      }
    } else {
      Alert.alert('Resposta incorreta', 'Tente novamente.');
    }
  };

  const submitQuiz = async () => {
    const payload = {
      usuarioId,
      respostas: responses,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/quiz/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao enviar respostas');
      setScore(data.score);
      updateQuizStatusLocal(selectedCategory, "completed");
      // Atualiza o progresso para "completed" e espera a atualização
      await updateQuizProgress();
      setMode('result');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  // Modal de pausa/quit
  const handleQuit = () => setShowQuitModal(true);
  const confirmQuit = () => {
    setShowQuitModal(false);
    setMode('menu');
    setSelectedCategory('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setScore(null);
  };
  const cancelQuit = () => setShowQuitModal(false);

  if (mode === 'menu') {
    return (
      <View style={styles.container}>
        <HeaderComum screenName="Quiz" />
        <Text style={styles.title}>Selecione uma Categoria</Text>
        <ScrollView contentContainerStyle={styles.categoriesContainer}>
          {categories.map((categoria) => (
            <TouchableOpacity
              key={categoria.name}
              style={styles.categoryCard}
              onPress={() => handleSelectCategory(categoria.name)}
            >
              <MaterialIcons name={categoria.icon} size={40} color="#fff" style={styles.categoryIcon} />
              <Text style={styles.categoryName}>{categoria.name}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(quizStatus[categoria.name]) }]}>
                <Text style={styles.statusText}>{getStatusText(quizStatus[categoria.name])}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (mode === 'quiz') {
    // Fallback: se não estiver carregando e o array de perguntas estiver vazio, exibe mensagem
    if (!loading && questions.length === 0) {
      return (
        <View style={styles.container}>
          <HeaderComum screenName={`Quiz - ${selectedCategory}`} />
          <Text style={styles.questionText}>Nenhuma pergunta disponível. Tente recarregar o quiz.</Text>
        </View>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    return (
      <View style={styles.container}>
        <HeaderComum screenName={`Quiz - ${selectedCategory}`} />
        <View style={styles.quizHeader}>
          <Text style={styles.questionCounter}>
            Pergunta {currentQuestionIndex + 1} de {questions.length}
          </Text>
          <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
            <Text style={styles.quitButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <View style={styles.quizContainer}>
            <Text style={styles.questionText}>{currentQuestion.pergunta}</Text>
            {currentQuestion.opcoes.map((opcao, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleSelectAnswer(index)}
              >
                <Text style={styles.optionText}>{opcao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Modal animationType="slide" transparent={true} visible={showQuitModal} onRequestClose={cancelQuit}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Parar o Jogo?</Text>
              <Text style={styles.modalMessage}>
                Seu progresso será perdido. Tem certeza que deseja sair?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={confirmQuit}>
                  <Text style={styles.buttonText}>Sim, Sair</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelQuit}>
                  <Text style={styles.buttonText}>Continuar Jogando</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (mode === 'result') {
    return (
      <View style={styles.container}>
        <HeaderComum screenName="Resultado" />
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            Sua pontuação: {score} de {questions.length}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => setMode('menu')}>
            <Text style={styles.backButtonText}>Voltar ao Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryCard: {
    backgroundColor: '#2979FF',
    width: 150,
    height: 150,
    borderRadius: 12,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  categoryIcon: { marginBottom: 10 },
  categoryName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusIndicator: {
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  questionCounter: { fontSize: 16 },
  quitButton: { backgroundColor: 'red', padding: 8, borderRadius: 5 },
  quitButtonText: { color: '#fff', fontWeight: 'bold' },
  quizContainer: { flex: 1, justifyContent: 'center' },
  questionText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  optionButton: { backgroundColor: '#E3F2FD', padding: 10, borderRadius: 5, marginVertical: 5 },
  optionText: { fontSize: 16, color: '#333', textAlign: 'center' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultText: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  backButton: { backgroundColor: '#2979FF', padding: 15, borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalMessage: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { backgroundColor: '#2979FF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  cancelButton: { backgroundColor: 'gray', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  pickerContainer: { marginBottom: 10 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  picker: { height: 50, width: '100%', borderWidth: 1, borderColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});

export default QuizScreen;
