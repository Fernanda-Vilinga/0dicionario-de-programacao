import React, { useEffect, useState,useContext } from 'react';
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
import { ThemeContext } from 'src/context/ThemeContext';
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
  const { theme } = useContext(ThemeContext); // Obtém o tema atual
  const [mode, setMode] = useState<'menu' | 'quiz' | 'result' | 'achievements'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<RespostaQuiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);
  const [categoriesCompleted, setCategoriesCompleted] = useState<Set<string>>(new Set());
  const [lastQuizDate, setLastQuizDate] = useState<string | null>(null);
  const [allCorrect, setAllCorrect] = useState(true);
  const [newBadges, setNewBadges] = useState<string[]>([]);

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

  // Carregar badges do AsyncStorage
  useEffect(() => {
    const loadBadges = async () => {
      try {
        const storedBadges = await AsyncStorage.getItem('badges');
        if (storedBadges) {
          setBadges(JSON.parse(storedBadges));
        }
      } catch (error) {
        console.error('Erro ao carregar badges:', error);
      }
    };
    loadBadges();
  }, []);

  // Persistir badges no AsyncStorage
  useEffect(() => {
    const saveBadges = async () => {
      try {
        await AsyncStorage.setItem('badges', JSON.stringify(badges));
      } catch (error) {
        console.error('Erro ao salvar badges:', error);
      }
    };
    saveBadges();
  }, [badges]);
  useEffect(() => {
    const loadLastQuizDate = async () => {
      try {
        const storedDate = await AsyncStorage.getItem(`lastQuizDate_${usuarioId}`);
        if (storedDate) {
          setLastQuizDate(storedDate);
        }
      } catch (error) {
        console.error('Erro ao carregar a data do último quiz:', error);
      }
    };
    loadLastQuizDate();
  }, [usuarioId]);

  // Carregar categorias completadas do AsyncStorage
  useEffect(() => {
    const loadCategoriesCompleted = async () => {
      try {
        const storedCategories = await AsyncStorage.getItem(`categoriesCompleted_${usuarioId}`);
        if (storedCategories) {
          setCategoriesCompleted(new Set(JSON.parse(storedCategories)));
        }
      } catch (error) {
        console.error('Erro ao carregar categorias completadas:', error);
      }
    };
    loadCategoriesCompleted();
  }, [usuarioId]);

  // Persistir categorias completadas no AsyncStorage
  useEffect(() => {
    const saveCategoriesCompleted = async () => {
      try {
        await AsyncStorage.setItem(`categoriesCompleted_${usuarioId}`, JSON.stringify(Array.from(categoriesCompleted)));
      } catch (error) {
        console.error('Erro ao salvar categorias completadas:', error);
      }
    };
    saveCategoriesCompleted();
  }, [categoriesCompleted, usuarioId]);


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
      setAllCorrect(true); // Resetar o estado para cada novo quiz
      setNewBadges([]);
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
    const isCorrect = selectedIndex === Number(currentQuestion.respostaCorreta);
  
    const resposta: RespostaQuiz = {
      idPergunta: currentQuestion.id,
      respostaDada: currentQuestion.opcoes[selectedIndex],
      correta: isCorrect,
    };
  
    setResponses(prev => [...prev, resposta]);
       // Obtenha a pergunta atual
        if (!isCorrect) {
            setAllCorrect(false);
            Alert.alert('Resposta incorreta', 'Tente novamente.');
        } else {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            } else {
                submitQuiz(); // Envia o quiz após a última resposta correta
            }
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

  const todasCorretas = responses.every(resposta => resposta.correta) && allCorrect;
  const isFirstQuiz = badges.length === 0;
  const isMaratoneiro = quizStatus[selectedCategory] === 'completed';
  const quizCategories = new Set(questions.map(q => q.categoria));
  

      const pontuacaoFinal = questions.length;

   
          setScore(pontuacaoFinal);
          updateQuizStatusLocal(selectedCategory, "completed");
          await updateQuizProgress();
     // Lógica para desbloquear badges
        const badgesParaDesbloquear: string[] = [];

      if (todasCorretas && !badges.includes('Placar Perfeito')) {
       badgesParaDesbloquear.push('Placar Perfeito');
          }
   
   if (isFirstQuiz && !badges.includes('Primeira Conquista')) {
              badgesParaDesbloquear.push('Primeira Conquista');
          }

     if (badgesParaDesbloquear.length > 0) {
      const novosBadges = [...badges, ...badgesParaDesbloquear];
                 await AsyncStorage.setItem('badges', JSON.stringify(novosBadges));
              setBadges(novosBadges);
                 setNewBadges(badgesParaDesbloquear);
          }
 // Update completed categories
      if (quizCategories && selectedCategory) {
        categoriesCompleted.add(selectedCategory);
      }
          // Persist updated completed categories
    await AsyncStorage.setItem(`categoriesCompleted_${usuarioId}`, JSON.stringify(Array.from(categoriesCompleted)));
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
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <HeaderComum screenName="Quiz" />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBackground }]}
          onPress={() => setMode('achievements')}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Minhas Conquistas</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textColor }]}>Selecione uma Categoria</Text>
        <ScrollView contentContainerStyle={styles.categoriesContainer}>
          {categories.map((categoria) => (
            <TouchableOpacity
              key={categoria.name}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.borderColor,
                },
              ]}
              onPress={() => handleSelectCategory(categoria.name)}
            >
              <MaterialIcons
                name={categoria.icon}
                size={40}
                color="#fff"
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryName, { color: theme.textColor }]}>
                {categoria.name}
              </Text>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(quizStatus[categoria.name]) },
                ]}
              >
                <Text style={[styles.statusText, { color: theme.textColor }]}>
                  {getStatusText(quizStatus[categoria.name])}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (mode === 'quiz') {
    if (!loading && questions.length === 0) {
      return (
        <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
          <HeaderComum screenName={`Quiz - ${selectedCategory}`} />
          <Text style={[styles.questionText, { color: theme.textColor }]}>
            Nenhuma pergunta disponível. Tente recarregar o quiz.
          </Text>
        </View>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <HeaderComum screenName={`Quiz - ${selectedCategory}`} />
        <View style={styles.quizHeader}>
          <Text style={[styles.questionCounter, { color: theme.textColor }]}>
            Pergunta {currentQuestionIndex + 1} de {questions.length}
          </Text>
          <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
            <Text style={[styles.quitButtonText, { color: theme.textColor }]}>Sair</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={theme.buttonBackground} />
        ) : (
          <View style={styles.quizContainer}>
            <Text style={[styles.questionText, { color: theme.textColor }]}>
              {currentQuestion.pergunta}
            </Text>
            {currentQuestion.opcoes.map((opcao, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.optionButton, { backgroundColor: theme.buttonBackground }]}
                onPress={() => handleSelectAnswer(index)}
              >
                <Text style={[styles.optionText, { color: theme.buttonText }]}>{opcao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showQuitModal}
          onRequestClose={cancelQuit}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>Parar o Jogo?</Text>
              <Text style={[styles.modalMessage, { color: theme.textColor }]}>
                Seu progresso será perdido. Tem certeza que deseja sair?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={confirmQuit}>
                  <Text style={[styles.buttonText, { color: theme.buttonText }]}>Sim, Sair</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelQuit}>
                  <Text style={[styles.buttonText, { color: theme.buttonText }]}>Continuar Jogando</Text>
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
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <HeaderComum screenName="Resultado" />
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: theme.textColor }]}>
            Sua pontuação: {score} de {questions.length}
          </Text>
          {newBadges.length > 0 && (
            <View>
              <Text style={[styles.badgeText, { color: theme.textColor }]}>
                Parabéns! Você desbloqueou os seguintes badges:
              </Text>
              {newBadges.map((badge, index) => (
                <Text key={index} style={[styles.badgeText, { color: theme.textColor }]}>
                  - {badge}
                </Text>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => setMode('menu')}>
            <Text style={[styles.backButtonText, { color: theme.buttonText }]}>Voltar ao Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'achievements') {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <HeaderComum screenName="Minhas Conquistas" />
        <Text style={[styles.title, { color: theme.textColor }]}>Conquistas</Text>
        <ScrollView contentContainerStyle={styles.achievementsContainer}>
          {badges && badges.length > 0 ? (
            badges.map((badge, index) => (
              <View key={index} style={styles.achievementItem}>
                <MaterialIcons
                  name="military-tech"
                  size={30}
                  color="#FFD700"
                  style={styles.achievementIcon}
                />
                <Text style={[styles.achievementText, { color: theme.textColor }]}>{badge}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noAchievementsText, { color: theme.textColor }]}>
              Nenhuma conquista por enquanto!
            </Text>
          )}
        </ScrollView>
        <TouchableOpacity style={styles.backButton} onPress={() => setMode('menu')}>
          <Text style={[styles.backButtonText, { color: theme.buttonText }]}>Voltar</Text>
        </TouchableOpacity>
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
    width: 160,
    height: 180,
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
  categoryIcon: { marginBottom: 10 , color:'blue'},
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
  resultTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  resultText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  backButton: { backgroundColor: '#2979FF', padding: 15, borderRadius: 8, alignItems:'center' },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalMessage: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { backgroundColor: '#2979FF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  cancelButton: { backgroundColor: 'gray', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  achievementIcon: {
    marginRight: 15,
    color: '#FFD700', // Cor dourada para o ícone
  },
  achievementText: {
    fontSize: 16,
  },
  achievementsContainer: {
    flexGrow: 1,
    padding: 10,
  },
  noAchievementsText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  badgeText: {
    fontSize: 16,
    marginTop: 10,
    color: '#2979FF',
    fontWeight: 'bold',
    textAlign: 'center',  
  } , button: {
    backgroundColor: '#2979FF', // Azul padrão do app
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3, // Sombra no Android
    marginBottom: 15,
    width: '80%',
    alignSelf: 'center'

  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

});

export default QuizScreen;
