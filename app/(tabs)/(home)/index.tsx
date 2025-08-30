import DeckCard from "@/components/DeckCard";
import DeckModal, { DeckModalHandle } from "@/components/DeckModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StorageService } from "@/services/storage";
import { Deck } from "@/types/flashcard";
import { triggerHaptic } from "@/utils/haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modal ref
  const deckModalRef = useRef<DeckModalHandle>(null);

  const handlePresentModalPress = useCallback(() => {
    deckModalRef.current?.present();
  }, []);

  const initializeSampleData = useCallback(async () => {
    await StorageService.initializeSampleData();
    loadDecks();
  }, []);

  useEffect(() => {
    initializeSampleData();
  }, [initializeSampleData]);

  // Refresh decks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [])
  );

  const loadDecks = async () => {
    const loadedDecks = await StorageService.getAllDecks();
    setDecks(loadedDecks);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDecks();
    setRefreshing(false);
  }, []);

  const handleSaveDeck = async (deck: Deck) => {
    await StorageService.saveDeck(deck);
    loadDecks();
  };

  const handleDeleteDeck = async (deckId: string) => {
    await StorageService.deleteDeck(deckId);
    loadDecks();
  };

  const handleDeckPress = async (deck: Deck) => {
    await triggerHaptic("light");
    router.push(`/deck/${deck.id}`);
  };

  const handleDeckLongPress = async (deck: Deck) => {
    await triggerHaptic("medium");
    Alert.alert(
      "Deck Options",
      `What would you like to do with "${deck.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () => deckModalRef.current?.present(deck),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await handleDeleteDeck(deck.id);
          },
        },
      ]
    );
  };

  const renderDeck = ({ item, index }: { item: Deck; index: number }) => (
    <DeckCard
      deck={item}
      onPress={() => handleDeckPress(item)}
      onLongPress={() => handleDeckLongPress(item)}
      index={index}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          My Decks
        </ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handlePresentModalPress}
        >
          <IconSymbol name="plus" size={24} color="white" />
        </Pressable>
      </View>

      <FlatList
        data={decks}
        renderItem={renderDeck}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No decks yet</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.icon }]}>
              Tap the + button to create your first deck
            </ThemedText>
          </View>
        }
      />

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
    paddingTop: Platform.OS === "ios" ? 50 : 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
  },
  bottomSheetContent: {
    height: "100%",
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
    minHeight: 80,
    textAlignVertical: "top",
  },
  colorPickerWrapper: {
    // overflow: "hidden",
    marginTop: 8,
  },
  colorPickerContent: {
    // paddingRight: 20,
  },
  colorPickerContainer: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  createButton: {
    // backgroundColor is set inline
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emojiSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectedEmojiButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedEmoji: {
    fontSize: 32,
  },
  emojiPickerScroll: {
    flex: 1,
    maxHeight: 60,
  },
  emojiPickerContent: {
    paddingRight: 20,
    gap: 8,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  emojiText: {
    fontSize: 24,
  },
});
