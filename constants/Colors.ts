/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#6366f1';
const tintColorDark = '#818cf8';

export const Colors = {
  light: {
    text: '#1f2937',
    background: '#ffffff',
    backgroundSecondary: '#f9fafb',
    tint: tintColorLight,
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    primary: '#6366f1',
    primaryGradientStart: '#6366f1',
    primaryGradientEnd: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    text: '#f3f4f6',
    background: '#0f0f10',
    backgroundSecondary: '#1a1a1c',
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
    card: '#1f1f23',
    cardBorder: '#2a2a2f',
    primary: '#818cf8',
    primaryGradientStart: '#818cf8',
    primaryGradientEnd: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
};

export const DeckColors = [
  { light: '#6366f1', dark: '#818cf8', name: 'Indigo', defaultEmoji: '📘' },
  { light: '#8b5cf6', dark: '#a78bfa', name: 'Purple', defaultEmoji: '🔮' },
  { light: '#ec4899', dark: '#f472b6', name: 'Pink', defaultEmoji: '🌸' },
  { light: '#ef4444', dark: '#f87171', name: 'Red', defaultEmoji: '❤️' },
  { light: '#f59e0b', dark: '#fbbf24', name: 'Amber', defaultEmoji: '⚡' },
  { light: '#10b981', dark: '#34d399', name: 'Emerald', defaultEmoji: '🌿' },
  { light: '#06b6d4', dark: '#22d3ee', name: 'Cyan', defaultEmoji: '💎' },
  { light: '#3b82f6', dark: '#60a5fa', name: 'Blue', defaultEmoji: '🌊' },
];

export const EMOJI_CATEGORIES = {
  learning: ['📚', '📖', '📝', '✏️', '📓', '📔', '📕', '📗', '📘', '📙', '🎓', '🧠'],
  nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌿', '🌱', '🌳', '🌲', '🍀', '🌊', '⛰️'],
  activities: ['⚽', '🏀', '🎾', '🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎸'],
  objects: ['💎', '🔮', '⚡', '🔥', '💫', '⭐', '🌟', '✨', '🎁', '🏆', '🥇', '👑'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '✅', '🔴', '🟢'],
  food: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥑', '🍕', '🍔', '🍰', '🍩', '🍪'],
};
