import React, { useState, forwardRef, useImperativeHandle, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, DeckColors, EMOJI_CATEGORIES } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Deck } from '@/types/flashcard';
import { StorageService } from '@/services/storage';
import { triggerNotification } from '@/utils/haptics';

export interface DeckModalHandle {
  present: (deck?: Deck) => void;
  dismiss: () => void;
}

interface DeckModalProps {
  onSave: (deck: Deck) => void;
  onDelete?: (deckId: string) => void;
}

const DeckModal = forwardRef<DeckModalHandle, DeckModalProps>(({ onSave, onDelete }, ref) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(DeckColors[0]);
  const [selectedEmoji, setSelectedEmoji] = useState('');

  const snapPoints = useMemo(() => ['65%', '75%', '95%'], []);

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

  useImperativeHandle(ref, () => ({
    present: (deck?: Deck) => {
      if (deck) {
        // Edit mode
        setEditingDeck(deck);
        setDeckName(deck.name);
        setDeckDescription(deck.description || '');
        const deckColor = DeckColors.find(c => 
          (colorScheme === 'dark' ? c.dark : c.light) === deck.color
        ) || DeckColors[0];
        setSelectedColor(deckColor);
        setSelectedEmoji(deck.icon || deckColor.defaultEmoji);
      } else {
        // Create mode
        setEditingDeck(null);
        setDeckName('');
        setDeckDescription('');
        setSelectedColor(DeckColors[0]);
        setSelectedEmoji('');
      }
      bottomSheetModalRef.current?.present();
    },
    dismiss: () => {
      bottomSheetModalRef.current?.dismiss();
      resetForm();
    },
  }));

  const resetForm = () => {
    setEditingDeck(null);
    setDeckName('');
    setDeckDescription('');
    setSelectedColor(DeckColors[0]);
    setSelectedEmoji('');
  };

  const handleSave = async () => {
    if (!deckName.trim()) {
      Alert.alert('Error', 'Please enter a deck name');
      return;
    }

    const deckData: Deck = {
      id: editingDeck?.id || StorageService.generateId(),
      name: deckName,
      description: deckDescription,
      color: colorScheme === 'dark' ? selectedColor.dark : selectedColor.light,
      icon: selectedEmoji || selectedColor.defaultEmoji,
      cardCount: editingDeck?.cardCount || 0,
      createdAt: editingDeck?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(deckData);
    await triggerNotification('success');
    bottomSheetModalRef.current?.dismiss();
    resetForm();
  };

  const handleDelete = () => {
    if (!editingDeck) return;
    
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${editingDeck.name}"? This will also delete all cards in this deck.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (onDelete) {
              onDelete(editingDeck.id);
              await triggerNotification('success');
              bottomSheetModalRef.current?.dismiss();
              resetForm();
            }
          },
        },
      ]
    );
  };

  const handleDismiss = () => {
    bottomSheetModalRef.current?.dismiss();
    resetForm();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose={true}
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
            {editingDeck ? 'Edit Deck' : 'Create New Deck'}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
            onPress={handleDismiss}
          >
            <IconSymbol name="xmark" size={24} color={colors.icon} />
          </Pressable>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Choose Emoji
            </Text>
            <View style={styles.emojiSelector}>
              <Pressable
                style={({ pressed }) => [
                  styles.selectedEmojiButton,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.cardBorder,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={styles.selectedEmoji}>
                  {selectedEmoji || selectedColor.defaultEmoji}
                </Text>
              </Pressable>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.emojiPickerScroll}
                contentContainerStyle={styles.emojiPickerContent}
              >
                {[
                  ...EMOJI_CATEGORIES.learning,
                  ...EMOJI_CATEGORIES.nature,
                  ...EMOJI_CATEGORIES.objects,
                ].map((emoji, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.emojiOption,
                      {
                        backgroundColor:
                          selectedEmoji === emoji
                            ? colors.primary
                            : 'transparent',
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Deck Name
            </Text>
            <BottomSheetTextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={deckName}
              onChangeText={setDeckName}
              placeholder="Enter deck name"
              placeholderTextColor={colors.icon}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Description (Optional)
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
              value={deckDescription}
              onChangeText={setDeckDescription}
              placeholder="Enter description"
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Choose Color
            </Text>
            <View style={styles.colorPickerWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorPickerContent}
              >
                {DeckColors.map((deckColor, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.colorOption,
                      {
                        backgroundColor:
                          colorScheme === 'dark'
                            ? deckColor.dark
                            : deckColor.light,
                        borderWidth: selectedColor === deckColor ? 3 : 0,
                        borderColor: colors.text,
                        opacity: pressed ? 0.7 : 1,
                        marginRight: index === DeckColors.length - 1 ? 0 : 12,
                      },
                    ]}
                    onPress={() => setSelectedColor(deckColor)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.modalFooter}>
          <Pressable
            style={({ pressed }) => [
              styles.modalButton,
              styles.cancelButton,
              {
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.7 : 1,
                flex: 1,
              },
            ]}
            onPress={handleDismiss}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.modalButton,
              styles.createButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
                flex: 1,
              },
            ]}
            onPress={handleSave}
          >
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
              {editingDeck ? 'Update' : 'Create'}
            </Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
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
    textAlignVertical: 'top',
  },
  emojiSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedEmojiButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emojiText: {
    fontSize: 24,
  },
  colorPickerWrapper: {
    marginTop: 8,
  },
  colorPickerContent: {},
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: 20,
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  createButton: {},
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

DeckModal.displayName = 'DeckModal';

export default DeckModal;