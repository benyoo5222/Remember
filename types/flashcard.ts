export interface Deck {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  category?: string;
  cardCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastStudied?: Date;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  nextReview?: Date;
  reviewCount: number;
  correctCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudySession {
  id: string;
  deckId: string;
  startedAt: Date;
  endedAt?: Date;
  cardsStudied: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface StudyStats {
  totalCardsStudied: number;
  totalDecks: number;
  studyStreak: number;
  lastStudyDate?: Date;
  totalStudyTime: number;
  averageAccuracy: number;
}

export interface DeckWithCards extends Deck {
  cards: Card[];
}

export type CardReviewResult = 'correct' | 'incorrect' | 'skipped';

export interface ReviewSession {
  cardId: string;
  result: CardReviewResult;
  timeSpent: number;
  timestamp: Date;
}