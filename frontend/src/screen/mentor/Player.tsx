import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { PauseCircle, PlayCircle } from "lucide-react-native";
import Svg, { Polyline } from "react-native-svg";
import ChatArea from "./ChatArea";
interface AudioPlayerProps {
  audioUri: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUri }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false, rate: playbackSpeed },
        onPlaybackStatusUpdate
      );
      setSound(sound);
    } catch (error) {
      console.error("Erro ao carregar áudio:", error);
    }
  };

  const unloadSound = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        console.error("Erro ao descarregar áudio:", error);
      }
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Erro ao reproduzir áudio:", error);
    }
  };

  const changePlaybackSpeed = async (speed: number) => {
    setPlaybackSpeed(speed);
    if (sound) {
      try {
        // Ajusta a velocidade de reprodução e mantém o pitch se possível
        await sound.setRateAsync(speed, true);
      } catch (error) {
        console.error("Erro ao ajustar velocidade:", error);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  useEffect(() => {
    loadSound();
    return () => {
      unloadSound().catch((error) =>
        console.error("Erro ao descarregar áudio:", error)
      );
    };
  }, [audioUri]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={togglePlayPause}>
        {isPlaying ? (
          <PauseCircle size={40} color="#2979FF" />
        ) : (
          <PlayCircle size={40} color="#2979FF" />
        )}
      </TouchableOpacity>
      <View style={styles.waveformWrapper}>
        <Svg height="30" width="100">
          {/* Exemplo de onda sonora estática; personalize conforme necessário */}
          <Polyline
            points="0,15 20,5 40,25 60,5 80,15 100,15"
            fill="none"
            stroke="#2979FF"
            strokeWidth="2"
          />
        </Svg>
      </View>
      <Text style={styles.timer}>
        {formatTime(position)} / {formatTime(duration)}
      </Text>
      <View style={styles.speedContainer}>
        <TouchableOpacity
          onPress={() => changePlaybackSpeed(1)}
          style={[
            styles.speedButton,
            playbackSpeed === 1 && styles.speedButtonActive,
          ]}
        >
          <Text
            style={[
              styles.speedButtonText,
              playbackSpeed === 1 && { color: "#fff" },
            ]}
          >
            1x
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => changePlaybackSpeed(1.5)}
          style={[
            styles.speedButton,
            playbackSpeed === 1.5 && styles.speedButtonActive,
          ]}
        >
          <Text
            style={[
              styles.speedButtonText,
              playbackSpeed === 1.5 && { color: "#fff" },
            ]}
          >
            1.5x
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => changePlaybackSpeed(2)}
          style={[
            styles.speedButton,
            playbackSpeed === 2 && styles.speedButtonActive,
          ]}
        >
          <Text
            style={[
              styles.speedButtonText,
              playbackSpeed === 2 && { color: "#fff" },
            ]}
          >
            2x
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  waveformWrapper: {
    marginHorizontal: 10,
  },
  timer: {
    color: "#333",
    marginLeft: 10,
  },
  speedContainer: {
    flexDirection: "row",
    marginLeft: 10,
  },
  speedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#2979FF",
    marginHorizontal: 2,
  },
  speedButtonActive: {
    backgroundColor: "#2979FF",
  },
  speedButtonText: {
    color: "#2979FF",
  },
});

export default AudioPlayer;
