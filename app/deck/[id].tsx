import DeckModal, { DeckModalHandle } from "@/components/DeckModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StorageService } from "@/services/storage";
import { Card, Deck } from "@/types/flashcard";
import { triggerHaptic, triggerNotification } from "@/utils/haptics";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );

  // Bottom sheet modal ref
  const cardModalRef = useRef<BottomSheetModal>(null);
  const deckModalRef = useRef<DeckModalHandle>(null);
  const snapPoints = useMemo(() => ["50%", "75%", "95%"], []);

  const loadDeckAndCards = useCallback(async () => {
    if (!id) return;
    const loadedDeck = await StorageService.getDeck(id);
    setDeck(loadedDeck);
    const loadedCards = await StorageService.getCardsByDeck(id);
    setCards(loadedCards);
  }, [id]);

  useEffect(() => {
    loadDeckAndCards();
  }, [id, loadDeckAndCards]);

  const handlePresentCardModal = useCallback(() => {
    cardModalRef.current?.present();
  }, []);

  const handleAddNewCard = useCallback(() => {
    // Clear state for new card creation
    setNewCardFront("");
    setNewCardBack("");
    setEditingCard(null);
    setDifficulty("medium");
    handlePresentCardModal();
  }, [handlePresentCardModal]);

  const handleDismissCardModal = useCallback(() => {
    cardModalRef.current?.dismiss();
    setNewCardFront("");
    setNewCardBack("");
    setEditingCard(null);
    setDifficulty("medium");
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  const handleSaveCard = async () => {
    if (!newCardFront.trim() || !newCardBack.trim()) {
      Alert.alert("Error", "Please enter both front and back text");
      return;
    }

    if (!deck) return;

    const cardData = {
      id: editingCard?.id || StorageService.generateId(),
      deckId: deck.id,
      front: newCardFront,
      back: newCardBack,
      difficulty,
      reviewCount: editingCard?.reviewCount || 0,
      correctCount: editingCard?.correctCount || 0,
      createdAt: editingCard?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await StorageService.saveCard(cardData);

    // Update deck card count if new card
    if (!editingCard) {
      const updatedDeck = {
        ...deck,
        cardCount: deck.cardCount + 1,
        updatedAt: new Date(),
      };
      await StorageService.saveDeck(updatedDeck);
      setDeck(updatedDeck);
    }

    await triggerNotification("success");
    handleDismissCardModal();
    loadDeckAndCards();
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setNewCardFront(card.front);
    setNewCardBack(card.back);
    setDifficulty(card.difficulty);
    handlePresentCardModal();
  };

  const handleDeleteCard = async (cardId: string) => {
    Alert.alert("Delete Card", "Are you sure you want to delete this card?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await StorageService.deleteCard(cardId);
          if (deck) {
            const updatedDeck = {
              ...deck,
              cardCount: Math.max(0, deck.cardCount - 1),
              updatedAt: new Date(),
            };
            await StorageService.saveDeck(updatedDeck);
            setDeck(updatedDeck);
          }

          loadDeckAndCards();
        },
      },
    ]);
  };

  const handleStartStudy = async () => {
    if (cards.length === 0) {
      Alert.alert("No Cards", "Add some cards first to start studying!");
      return;
    }
    await triggerHaptic("medium");
    router.push(`/study/${deck?.id}`);
  };

  const handleEditDeck = () => {
    if (deck) {
      deckModalRef.current?.present(deck);
    }
  };

  const handleSaveDeck = async (updatedDeck: Deck) => {
    await StorageService.saveDeck(updatedDeck);
    setDeck(updatedDeck);
    loadDeckAndCards();
  };

  const handleDeleteDeck = async (deckId: string) => {
    Alert.alert(
      "Delete Deck",
      `Are you sure you want to delete "${deck?.name}"? This will also delete all cards in this deck.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await StorageService.deleteDeck(deckId);
            router.back();
          },
        },
      ]
    );
  };

  const renderCard = ({ item, index }: { item: Card; index: number }) => (
    <Pressable
      style={({ pressed }) => [
        styles.cardItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={() => handleEditCard(item)}
      hitSlop={20}
    >
      <View style={styles.cardContent}>
        <Text
          style={[styles.cardFront, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.front}
        </Text>
        <View style={styles.cardActions}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty) },
            ]}
          >
            <Text style={styles.difficultyText}>
              {item.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return colors.success;
      case "medium":
        return colors.warning;
      case "hard":
        return colors.error;
      default:
        return colors.icon;
    }
  };

  if (!deck) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

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

      <View style={[styles.header, { backgroundColor: deck.color }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <Text style={styles.deckEmoji}>{deck.icon}</Text>
            <View style={styles.deckInfo}>
              <Text style={styles.deckName}>{deck.name}</Text>
              {deck.description && (
                <Text style={styles.deckDescription}>{deck.description}</Text>
              )}
              <Text style={styles.cardCount}>{cards.length} cards</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleEditDeck}
              hitSlop={20}
            >
              <IconSymbol
                name="pencil"
                size={20}
                color="rgba(255,255,255,0.9)"
              />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => handleDeleteDeck(deck.id)}
              hitSlop={20}
            >
              <IconSymbol
                name="trash"
                size={20}
                color="rgba(255,255,255,0.9)"
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.studyButton,
            {
              backgroundColor: "rgba(255,255,255,0.95)",
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={handleStartStudy}
          hitSlop={20}
        >
          <IconSymbol name="play.fill" size={20} color={deck.color} />
          <Text style={[styles.studyButtonText, { color: deck.color }]}>
            Start Study Session
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="plus.circle" size={64} color={colors.icon} />
            <ThemedText style={styles.emptyText}>No cards yet</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.icon }]}>
              Tap the + button to add your first card
            </ThemedText>
          </View>
        }
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={handleAddNewCard}
        hitSlop={20}
      >
        <IconSymbol name="plus" size={28} color="white" />
      </Pressable>

      <BottomSheetModal
        ref={cardModalRef}
        index={1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        onDismiss={handleDismissCardModal}
        keyboardBehavior="extend"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.icon }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.bottomSheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingCard ? "Edit Card" : "Add New Card"}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.5 : 1 },
              ]}
              onPress={handleDismissCardModal}
            >
              <IconSymbol name="xmark" size={24} color={colors.icon} />
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Front (Question)
              </Text>
              <BottomSheetTextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={newCardFront}
                onChangeText={setNewCardFront}
                placeholder="Enter question or prompt"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Back (Answer)
              </Text>
              <BottomSheetTextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={newCardBack}
                onChangeText={setNewCardBack}
                placeholder="Enter answer"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={5}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Difficulty
              </Text>
              <View style={styles.difficultyPicker}>
                {(["easy", "medium", "hard"] as const).map((level) => (
                  <Pressable
                    key={level}
                    style={({ pressed }) => [
                      styles.difficultyOption,
                      {
                        backgroundColor:
                          difficulty === level
                            ? getDifficultyColor(level)
                            : colors.backgroundSecondary,
                        borderColor: colors.cardBorder,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => setDifficulty(level)}
                  >
                    <Text
                      style={[
                        styles.difficultyOptionText,
                        {
                          color: difficulty === level ? "white" : colors.text,
                        },
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            {editingCard ? (
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: colors.error,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => {
                  handleDeleteCard(editingCard.id);
                  handleDismissCardModal();
                }}
              >
                <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                  Delete
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  {
                    borderColor: colors.cardBorder,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={handleDismissCardModal}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.modalButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={async () => {
                handleSaveCard();
              }}
              hitSlop={20}
            >
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                {editingCard ? "Update" : "Add Card"}
              </Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <DeckModal
        ref={deckModalRef}
        onSave={handleSaveDeck}
        onDelete={handleDeleteDeck}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  deckEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  cardCount: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  studyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studyButtonText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardItem: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "column",
    gap: 12,
  },
  cardText: {
    flex: 1,
    marginRight: 12,
  },
  cardFront: {
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 24,
  },
  cardBack: {
    fontSize: 14,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardDeleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  difficultyText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  difficultyPicker: {
    flexDirection: "row",
    gap: 12,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  difficultyOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    paddingTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
