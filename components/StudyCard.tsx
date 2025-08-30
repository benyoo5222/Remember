import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Card as FlashCard } from '@/types/flashcard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { triggerHaptic } from '@/utils/haptics';

type StudyCardProps = {
  card: FlashCard;
  index: number;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  animatedValue: SharedValue<number>;
  maxVisibleItems: number;
  dataLength: number;
  displayCards: FlashCard[];
  setDisplayCards: React.Dispatch<React.SetStateAction<FlashCard[]>>;
  onCorrect: () => void;
  onIncorrect: () => void;
  isSessionComplete: boolean;
};

const SWIPE_THRESHOLD = 150;
const SWIPE_VELOCITY = 1000;
const CARD_OFFSET_Y = 8;
const CARD_SCALE_MULTIPLIER = 0.03;

export interface StudyCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

const StudyCard = React.forwardRef<StudyCardRef, StudyCardProps>(({
  card,
  index,
  currentIndex,
  setCurrentIndex,
  animatedValue,
  maxVisibleItems,
  dataLength,
  displayCards,
  setDisplayCards,
  onCorrect,
  onIncorrect,
  isSessionComplete,
}, ref) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Each card has its own animation values
  const translateX = useSharedValue(0);
  const direction = useSharedValue(0);
  const isFlippedValue = useSharedValue(0);
  const [isFlipped, setIsFlipped] = React.useState(false);

  const handleFlip = () => {
    'worklet';
    isFlippedValue.value = withTiming(isFlippedValue.value ? 0 : 1, {
      duration: 600,
    });
    runOnJS(setIsFlipped)(!isFlipped);
    runOnJS(triggerHaptic)('light');
  };

  const handleSwipeComplete = (isCorrect: boolean) => {
    // Update counts
    if (isCorrect) {
      onCorrect();
    } else {
      onIncorrect();
    }
    
    // Add card to end of array (like Rakha112)
    setDisplayCards([...displayCards, displayCards[currentIndex]]);
    // Move to next card
    setCurrentIndex(currentIndex + 1);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // Only the current card responds to gestures
      if (currentIndex === index) {
        const isSwipeRight = e.translationX > 0;
        direction.value = isSwipeRight ? 1 : -1;
        
        translateX.value = e.translationX;
        animatedValue.value = interpolate(
          Math.abs(e.translationX),
          [0, SCREEN_WIDTH],
          [index, index + 1],
        );
      }
    })
    .onEnd((e) => {
      if (currentIndex === index) {
        const shouldSwipe = 
          Math.abs(e.translationX) > SWIPE_THRESHOLD || 
          Math.abs(e.velocityX) > SWIPE_VELOCITY;
        
        if (shouldSwipe) {
          // Animate card off screen
          translateX.value = withTiming(SCREEN_WIDTH * direction.value, {}, () => {
            runOnJS(handleSwipeComplete)(e.translationX > 0);
          });
          animatedValue.value = withTiming(currentIndex + 1);
        } else {
          // Spring back to center
          translateX.value = withTiming(0, { duration: 500 });
          animatedValue.value = withTiming(currentIndex, { duration: 500 });
        }
      }
    });

  // Card-specific animated style
  const animatedStyle = useAnimatedStyle(() => {
    const isCurrentCard = index === currentIndex;

    const translateY = interpolate(
      animatedValue.value,
      [index - 1, index],
      [-CARD_OFFSET_Y, 0],
    );

    const scale = interpolate(
      animatedValue.value,
      [index - 1, index],
      [1 - CARD_SCALE_MULTIPLIER, 1],
    );

    const rotateZ = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH],
      [0, 20],
    );

    const opacity = interpolate(
      animatedValue.value + maxVisibleItems,
      [index, index + 1],
      [0, 1],
    );

    return {
      transform: [
        { translateY: isCurrentCard ? 0 : translateY },
        { scale: isCurrentCard ? 1 : scale },
        { translateX: translateX.value },
        {
          rotateZ: isCurrentCard ? `${direction.value * rotateZ}deg` : '0deg',
        },
      ],
      opacity: index < currentIndex + maxVisibleItems ? 1 : opacity,
    };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spin = interpolate(isFlippedValue.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotateY: `${spin}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spin = interpolate(isFlippedValue.value, [0, 1], [180, 360]);
    return {
      transform: [{ rotateY: `${spin}deg` }],
      backfaceVisibility: 'hidden',
    };
  });


  const isCurrentCard = index === currentIndex;

  // Expose swipe methods via ref
  React.useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      if (currentIndex === index && !isSessionComplete) {
        direction.value = -1;
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)(false);
        });
        animatedValue.value = withTiming(currentIndex + 1);
      }
    },
    swipeRight: () => {
      if (currentIndex === index && !isSessionComplete) {
        direction.value = 1;
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)(true);
        });
        animatedValue.value = withTiming(currentIndex + 1);
      }
    },
  }), [currentIndex, index, isSessionComplete, SCREEN_WIDTH]);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            zIndex: dataLength - index,
            position: 'absolute',
          },
          animatedStyle,
        ]}
      >
        <Pressable
          onPress={isCurrentCard && !isSessionComplete ? handleFlip : undefined}
          style={styles.cardPressable}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
              <Text style={[styles.cardLabel, { color: colors.icon }]}>
                QUESTION
              </Text>
              <Text style={[styles.cardText, { color: colors.text }]}>
                {card.front}
              </Text>
              <Text style={[styles.tapHint, { color: colors.icon }]}>
                Tap to reveal answer
              </Text>
            </Animated.View>

            <Animated.View
              style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}
            >
              <Text style={[styles.cardLabel, { color: colors.icon }]}>
                ANSWER
              </Text>
              <Text style={[styles.cardText, { color: colors.text }]}>
                {card.back}
              </Text>
              <View style={styles.swipeHint}>
                <Text style={[styles.swipeHintText, { color: colors.error }]}>
                  ← Wrong
                </Text>
                <Text
                  style={[styles.swipeHintText, { color: colors.success }]}
                >
                  Correct →
                </Text>
              </View>
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  cardPressable: {
    width: '100%',
  },
  card: {
    width: '90%',
    height: 300,
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 16,
  },
  cardText: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  tapHint: {
    position: 'absolute',
    bottom: 24,
    fontSize: 14,
    opacity: 0.6,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
  },
  swipeHintText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StudyCard;