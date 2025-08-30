import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";

import StudyCard, { StudyCardRef } from "@/components/StudyCard";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StorageService } from "@/services/storage";
import { Card, Deck, StudySession } from "@/types/flashcard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_VISIBLE_CARDS = 3;
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.5;

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [session, setSession] = useState<StudySession | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardRefs = useRef<(StudyCardRef | null)[]>([]);

  // Shared animation value for overall progress (like Rakha112)
  const animatedValue = useSharedValue(0);

  const loadDeckAndCards = useCallback(async () => {
    if (!deckId) return;
    const loadedDeck = await StorageService.getDeck(deckId);
    setDeck(loadedDeck);
    const loadedCards = await StorageService.getCardsByDeck(deckId);
    setCards(loadedCards);
  }, [deckId]);

  const startSession = useCallback(async () => {
    if (!deckId) return;
    const newSession: StudySession = {
      id: StorageService.generateId(),
      deckId,
      startedAt: new Date(),
      cardsStudied: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
    };
    setSession(newSession);
  }, [deckId]);

  useEffect(() => {
    loadDeckAndCards();
    startSession();

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [deckId, loadDeckAndCards, startSession]);

  const finishSession = useCallback(
    async (finalCorrect?: number, finalIncorrect?: number) => {
      if (!session || !deck) return;

      // Use passed values or state values
      const correct = finalCorrect ?? correctCount;
      const incorrect = finalIncorrect ?? incorrectCount;

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const totalAnswered = correct + incorrect;
      const accuracy =
        totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;

      const updatedSession: StudySession = {
        ...session,
        endedAt: new Date(),
        cardsStudied: cards.length,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
      };

      await StorageService.saveStudySession(updatedSession);

      // Update study stats
      const stats = await StorageService.getStudyStats();
      const sessions = await StorageService.getAllStudySessions();
      const totalCorrect =
        sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0) + correct;
      const totalCards =
        sessions.reduce(
          (sum, s) => sum + (s.correctAnswers || 0) + (s.incorrectAnswers || 0),
          0
        ) + totalAnswered;

      await StorageService.updateStudyStats({
        ...stats,
        totalCardsStudied: stats.totalCardsStudied + cards.length,
        totalStudyTime: stats.totalStudyTime + Math.floor(elapsedTime / 60),
        averageAccuracy:
          totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0,
        lastStudyDate: new Date(),
      });

      // Update deck last studied date
      const updatedDeck = { ...deck, lastStudied: new Date() };
      await StorageService.saveDeck(updatedDeck);

      Alert.alert(
        "Session Complete! 🎉",
        `Cards Studied: ${
          cards.length
        }\nCorrect: ${correct}\nIncorrect: ${incorrect}\nAccuracy: ${accuracy}%\nTime: ${formatTime(
          elapsedTime
        )}`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    [
      session,
      deck,
      correctCount,
      incorrectCount,
      cards.length,
      elapsedTime,
      router,
    ]
  );

  const handleCorrect = useCallback(() => {
    const newCount = correctCount + 1;
    setCorrectCount(newCount);

    // Check if we've gone through all original cards
    if (currentIndex >= cards.length - 1) {
      setSessionComplete(true);
      finishSession(newCount, incorrectCount);
    }
  }, [correctCount, incorrectCount, currentIndex, cards.length, finishSession]);

  const handleIncorrect = useCallback(() => {
    const newCount = incorrectCount + 1;
    setIncorrectCount(newCount);

    // Check if we've gone through all original cards
    if (currentIndex >= cards.length - 1) {
      setSessionComplete(true);
      finishSession(correctCount, newCount);
    }
  }, [correctCount, incorrectCount, currentIndex, cards.length, finishSession]);

  const handleButtonPress = (isCorrect: boolean) => {
    if (sessionComplete) return;

    // Find the current card ref and trigger its swipe animation
    const currentCard = cardRefs.current[currentIndex];
    if (currentCard) {
      if (isCorrect) {
        currentCard.swipeRight();
      } else {
        currentCard.swipeLeft();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Remove all old animation logic - StudyCard handles its own animations

  if (!deck || cards.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            title: "Study",
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: deck.name,
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { backgroundColor: colors.cardBorder }]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {currentIndex + 1} / {cards.length}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <View style={[styles.scoreItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.scoreLabel, { color: colors.error }]}>✗</Text>
            <Text style={[styles.scoreValue, { color: colors.text }]}>
              {incorrectCount}
            </Text>
          </View>
          <View
            style={[styles.timerContainer, { backgroundColor: colors.card }]}
          >
            <IconSymbol name="clock" size={16} color={colors.icon} />
            <Text style={[styles.timerText, { color: colors.text }]}>
              {formatTime(elapsedTime)}
            </Text>
          </View>
          <View style={[styles.scoreItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.scoreLabel, { color: colors.success }]}>
              ✓
            </Text>
            <Text style={[styles.scoreValue, { color: colors.text }]}>
              {correctCount}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContainer}>
        {cards.map((card, index) => {
          // Only render cards within visible range
          if (
            index > currentIndex + MAX_VISIBLE_CARDS ||
            index < currentIndex
          ) {
            return null;
          }

          return (
            <StudyCard
              key={index}
              ref={(ref) => {
                cardRefs.current[index] = ref;
              }}
              card={card}
              index={index}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              animatedValue={animatedValue}
              maxVisibleItems={MAX_VISIBLE_CARDS}
              dataLength={cards.length}
              displayCards={cards}
              setDisplayCards={setCards}
              onCorrect={handleCorrect}
              onIncorrect={handleIncorrect}
              isSessionComplete={sessionComplete}
            />
          );
        })}
      </View>

      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            {
              backgroundColor: colors.error,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => handleButtonPress(false)}
          hitSlop={20}
          disabled={sessionComplete}
        >
          <IconSymbol name="xmark" size={28} color="white" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.skipButton,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => handleButtonPress(false)}
          disabled={sessionComplete}
        >
          <Text style={[styles.skipText, { color: colors.text }]}>Skip</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            {
              backgroundColor: colors.success,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => handleButtonPress(true)}
          hitSlop={20}
          disabled={sessionComplete}
        >
          <IconSymbol name="checkmark" size={28} color="white" />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 0 : 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  scoreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  cardWrapper: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardPressable: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBack: {
    // All transforms and visibility handled in animated style
  },
  cardLabel: {
    position: "absolute",
    top: 20,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  cardText: {
    fontSize: 24,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 32,
  },
  tapHint: {
    position: "absolute",
    bottom: 20,
    fontSize: 14,
  },
  swipeHint: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 24,
  },
  swipeHintText: {
    fontSize: 14,
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 20,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
