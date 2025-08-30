import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, DeckColors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Deck } from "@/types/flashcard";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  onLongPress?: () => void;
  index: number;
}

export default function DeckCard({
  deck,
  onPress,
  onLongPress,
  index,
}: DeckCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 + index * 50 });
  }, [index, opacity]);

  const getDeckColor = () => {
    const colorIndex = DeckColors.findIndex(
      (c) => c.light === deck.color || c.dark === deck.color
    );
    if (colorIndex >= 0) {
      return colorScheme === "dark"
        ? DeckColors[colorIndex].dark
        : DeckColors[colorIndex].light;
    }
    return colors.primary;
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const gradientColors: [string, string] = [
    getDeckColor(),
    colorScheme === "dark" ? `${getDeckColor()}CC` : `${getDeckColor()}DD`,
  ];

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {deck.icon && <Text style={styles.icon}>{deck.icon}</Text>}
            <Text style={styles.name} numberOfLines={2}>
              {deck.name}
            </Text>
            {deck.category && (
              <Text style={styles.category}>{deck.category}</Text>
            )}
            <View style={styles.footer}>
              <View style={styles.cardCount}>
                <IconSymbol
                  name="rectangle.stack.fill"
                  size={16}
                  color="white"
                />
                <Text style={styles.countText}>{deck.cardCount} cards</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    marginBottom: 16,
  },
  touchable: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  footer: {
    marginTop: "auto",
  },
  cardCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
});
