import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Card } from "@/types/flashcard";
import { triggerHaptic } from "@/utils/haptics";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = height * 0.5;

interface FlashCardProps {
  card: Card;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  isFlipped?: boolean;
  onFlip?: () => void;
}

export default function FlashCard({
  card,
  onSwipeLeft,
  onSwipeRight,
  isFlipped = false,
  onFlip,
}: FlashCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [flipped, setFlipped] = useState(isFlipped);
  const rotateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleFlip = () => {
    "worklet";
    runOnJS(triggerHaptic)("light");

    const newValue = rotateY.value === 0 ? 180 : 0;
    rotateY.value = withSpring(newValue, {
      damping: 15,
      stiffness: 100,
    });
    runOnJS(setFlipped)(!flipped);
    if (onFlip) {
      runOnJS(onFlip)();
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      rotateY.value,
      [0, 180],
      [0, 180],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { perspective: 1000 },
        { rotateY: `${rotate}deg` },
        { scale: scale.value },
      ],
      opacity: interpolate(
        rotateY.value,
        [0, 90, 180],
        [1, 0, 0],
        Extrapolate.CLAMP
      ),
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      rotateY.value,
      [0, 180],
      [180, 360],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { perspective: 1000 },
        { rotateY: `${rotate}deg` },
        { scale: scale.value },
      ],
      opacity: interpolate(
        rotateY.value,
        [0, 90, 180],
        [0, 0, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getDifficultyColor = () => {
    switch (card.difficulty) {
      case "easy":
        return colors.success;
      case "medium":
        return colors.warning;
      case "hard":
        return colors.error;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleFlip}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        {/* Front of card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadow,
            },
            frontAnimatedStyle,
          ]}
        >
          <View style={styles.difficultyIndicator}>
            <View
              style={[
                styles.difficultyDot,
                { backgroundColor: getDifficultyColor() },
              ]}
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardText, { color: colors.text }]}>
              {card.front}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={[styles.flipHint, { color: colors.icon }]}>
              Tap to flip
            </Text>
          </View>
        </Animated.View>

        {/* Back of card */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadow,
            },
            backAnimatedStyle,
          ]}
        >
          <View style={styles.difficultyIndicator}>
            <View
              style={[
                styles.difficultyDot,
                { backgroundColor: getDifficultyColor() },
              ]}
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardText, { color: colors.text }]}>
              {card.back}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.swipeHints}>
              <Text style={[styles.swipeHint, { color: colors.error }]}>
                ← Don&apos;t know
              </Text>
              <Text style={[styles.swipeHint, { color: colors.success }]}>
                Know it →
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  touchable: {
    width: "100%",
    height: "100%",
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 24,
    padding: 24,
    backfaceVisibility: "hidden",
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardBack: {
    position: "absolute",
  },
  difficultyIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 32,
  },
  cardFooter: {
    paddingTop: 16,
  },
  flipHint: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
  },
  swipeHints: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  swipeHint: {
    fontSize: 14,
    fontWeight: "600",
  },
});
