import AsyncStorage from '@react-native-async-storage/async-storage';
import { Deck, Card, StudySession, StudyStats, DeckWithCards } from '@/types/flashcard';

const STORAGE_KEYS = {
  DECKS: '@flashcards_decks',
  CARDS: '@flashcards_cards',
  STUDY_SESSIONS: '@flashcards_study_sessions',
  STUDY_STATS: '@flashcards_study_stats',
};

export class StorageService {
  // Deck Operations
  static async getAllDecks(): Promise<Deck[]> {
    try {
      const decksJson = await AsyncStorage.getItem(STORAGE_KEYS.DECKS);
      if (!decksJson) return [];
      const decks = JSON.parse(decksJson);
      return decks.map((deck: any) => ({
        ...deck,
        createdAt: new Date(deck.createdAt),
        updatedAt: new Date(deck.updatedAt),
        lastStudied: deck.lastStudied ? new Date(deck.lastStudied) : undefined,
      }));
    } catch (error) {
      console.error('Error getting decks:', error);
      return [];
    }
  }

  static async getDeck(id: string): Promise<Deck | null> {
    const decks = await this.getAllDecks();
    return decks.find(deck => deck.id === id) || null;
  }

  static async getDeckWithCards(id: string): Promise<DeckWithCards | null> {
    const deck = await this.getDeck(id);
    if (!deck) return null;
    
    const cards = await this.getCardsByDeck(id);
    return { ...deck, cards };
  }

  static async saveDeck(deck: Deck): Promise<void> {
    try {
      const decks = await this.getAllDecks();
      const existingIndex = decks.findIndex(d => d.id === deck.id);
      
      if (existingIndex >= 0) {
        decks[existingIndex] = deck;
      } else {
        decks.push(deck);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
    } catch (error) {
      console.error('Error saving deck:', error);
      throw error;
    }
  }

  static async deleteDeck(id: string): Promise<void> {
    try {
      const decks = await this.getAllDecks();
      const filteredDecks = decks.filter(deck => deck.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(filteredDecks));
      
      // Also delete all cards in this deck
      const cards = await this.getAllCards();
      const filteredCards = cards.filter(card => card.deckId !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(filteredCards));
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw error;
    }
  }

  // Card Operations
  static async getAllCards(): Promise<Card[]> {
    try {
      const cardsJson = await AsyncStorage.getItem(STORAGE_KEYS.CARDS);
      if (!cardsJson) return [];
      const cards = JSON.parse(cardsJson);
      return cards.map((card: any) => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt),
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
        nextReview: card.nextReview ? new Date(card.nextReview) : undefined,
      }));
    } catch (error) {
      console.error('Error getting cards:', error);
      return [];
    }
  }

  static async getCard(id: string): Promise<Card | null> {
    const cards = await this.getAllCards();
    return cards.find(card => card.id === id) || null;
  }

  static async getCardsByDeck(deckId: string): Promise<Card[]> {
    const cards = await this.getAllCards();
    return cards.filter(card => card.deckId === deckId);
  }

  static async saveCard(card: Card): Promise<void> {
    try {
      const cards = await this.getAllCards();
      const existingIndex = cards.findIndex(c => c.id === card.id);
      
      if (existingIndex >= 0) {
        cards[existingIndex] = card;
      } else {
        cards.push(card);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
      
      // Update deck card count
      const deck = await this.getDeck(card.deckId);
      if (deck) {
        const deckCards = await this.getCardsByDeck(card.deckId);
        deck.cardCount = deckCards.length;
        deck.updatedAt = new Date();
        await this.saveDeck(deck);
      }
    } catch (error) {
      console.error('Error saving card:', error);
      throw error;
    }
  }

  static async deleteCard(id: string): Promise<void> {
    try {
      const cards = await this.getAllCards();
      const cardToDelete = cards.find(c => c.id === id);
      if (!cardToDelete) return;
      
      const filteredCards = cards.filter(card => card.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(filteredCards));
      
      // Update deck card count
      const deck = await this.getDeck(cardToDelete.deckId);
      if (deck) {
        deck.cardCount = Math.max(0, deck.cardCount - 1);
        deck.updatedAt = new Date();
        await this.saveDeck(deck);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }

  // Study Session Operations
  static async saveStudySession(session: StudySession): Promise<void> {
    try {
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
      const sessions = sessionsJson ? JSON.parse(sessionsJson) : [];
      sessions.push(session);
      await AsyncStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving study session:', error);
      throw error;
    }
  }

  static async getStudySessions(): Promise<StudySession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
      if (!sessionsJson) return [];
      const sessions = JSON.parse(sessionsJson);
      return sessions.map((session: any) => ({
        ...session,
        startedAt: new Date(session.startedAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : undefined,
      }));
    } catch (error) {
      console.error('Error getting study sessions:', error);
      return [];
    }
  }

  // Study Stats Operations
  static async getStudyStats(): Promise<StudyStats> {
    try {
      const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_STATS);
      if (!statsJson) {
        return {
          totalCardsStudied: 0,
          totalDecks: 0,
          studyStreak: 0,
          totalStudyTime: 0,
          averageAccuracy: 0,
        };
      }
      const stats = JSON.parse(statsJson);
      return {
        ...stats,
        lastStudyDate: stats.lastStudyDate ? new Date(stats.lastStudyDate) : undefined,
      };
    } catch (error) {
      console.error('Error getting study stats:', error);
      return {
        totalCardsStudied: 0,
        totalDecks: 0,
        studyStreak: 0,
        totalStudyTime: 0,
        averageAccuracy: 0,
      };
    }
  }

  static async updateStudyStats(stats: StudyStats): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STUDY_STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating study stats:', error);
      throw error;
    }
  }

  // Utility functions
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.DECKS,
        STORAGE_KEYS.CARDS,
        STORAGE_KEYS.STUDY_SESSIONS,
        STORAGE_KEYS.STUDY_STATS,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Initialize with sample data
  static async initializeSampleData(): Promise<void> {
    const decks = await this.getAllDecks();
    if (decks.length > 0) return; // Don't initialize if data already exists

    // Create sample deck
    const sampleDeck: Deck = {
      id: this.generateId(),
      name: 'Welcome to Flashcards',
      description: 'Get started with your first deck',
      color: '#6366f1',
      icon: '👋',
      category: 'Tutorial',
      cardCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveDeck(sampleDeck);

    // Create sample cards
    const sampleCards: Card[] = [
      {
        id: this.generateId(),
        deckId: sampleDeck.id,
        front: 'What is a flashcard?',
        back: 'A card with a question on one side and the answer on the other, used for studying and memorization.',
        difficulty: 'easy',
        reviewCount: 0,
        correctCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.generateId(),
        deckId: sampleDeck.id,
        front: 'How do you study with flashcards?',
        back: 'Read the question, try to recall the answer, then flip the card to check. Swipe right if you knew it, left if you need more practice.',
        difficulty: 'easy',
        reviewCount: 0,
        correctCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.generateId(),
        deckId: sampleDeck.id,
        front: 'Why use spaced repetition?',
        back: 'Reviewing cards at increasing intervals helps move information from short-term to long-term memory more effectively.',
        difficulty: 'medium',
        reviewCount: 0,
        correctCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const card of sampleCards) {
      await this.saveCard(card);
    }
  }
}