import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StorageService } from '@/services/storage';
import { Deck } from '@/types/flashcard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '@/utils/haptics';

export default function StudyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    const loadedDecks = await StorageService.getAllDecks();
    setDecks(loadedDecks.filter(deck => deck.cardCount > 0));
  };

  const startStudySession = async (deck: Deck) => {
    await triggerHaptic('light');
    Alert.alert('Study Session', `Starting study session for: ${deck.name}`);
    // Navigate to study session screen (to be implemented)
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>Study</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
            Select a deck to start studying
          </ThemedText>
        </ThemedView>

        {decks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="brain" size={64} color={colors.icon} style={{ opacity: 0.5 }} />
            <ThemedText style={styles.emptyText}>No decks available</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.icon }]}>
              Create some cards in your decks first
            </ThemedText>
          </View>
        ) : (
          <View style={styles.deckList}>
            {decks.map((deck) => (
              <TouchableOpacity
                key={deck.id}
                style={styles.deckItem}
                onPress={() => startStudySession(deck)}
              >
                <LinearGradient
                  colors={[
                    deck.color,
                    colorScheme === 'dark' ? `${deck.color}AA` : `${deck.color}CC`,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deckGradient}
                >
                  <View style={styles.deckContent}>
                    <View style={styles.deckInfo}>
                      {deck.icon && <Text style={styles.deckIcon}>{deck.icon}</Text>}
                      <View style={styles.deckText}>
                        <Text style={styles.deckName}>{deck.name}</Text>
                        <Text style={styles.cardCount}>{deck.cardCount} cards</Text>
                      </View>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.quickStart}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => Alert.alert('Coming Soon', 'Random practice will be available soon')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryGradientEnd }]}>
              <IconSymbol name="shuffle" size={24} color="white" />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Random Practice</Text>
              <Text style={[styles.actionSubtitle, { color: colors.icon }]}>
                Study cards from all decks
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => Alert.alert('Coming Soon', 'Review mode will be available soon')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
              <IconSymbol name="clock.arrow.circlepath" size={24} color="white" />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Due for Review</Text>
              <Text style={[styles.actionSubtitle, { color: colors.icon }]}>
                Cards that need reviewing
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
  },
  deckList: {
    paddingHorizontal: 20,
  },
  deckItem: {
    marginBottom: 12,
  },
  deckGradient: {
    borderRadius: 16,
    padding: 20,
  },
  deckContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deckInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deckIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  deckText: {
    flex: 1,
  },
  deckName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickStart: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
  },
});
