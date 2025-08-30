import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StorageService } from "@/services/storage";
import { StudyStats } from "@/types/flashcard";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [stats, setStats] = useState<StudyStats>({
    totalCardsStudied: 0,
    totalDecks: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    averageAccuracy: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    const loadedStats = await StorageService.getStudyStats();
    const decks = await StorageService.getAllDecks();
    setStats({
      ...loadedStats,
      totalDecks: decks.length,
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Your Progress
          </ThemedText>
        </ThemedView>

        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              styles.largeCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <IconSymbol name="brain" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats.totalCardsStudied}
            </Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Cards Studied
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              styles.largeCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primaryGradientEnd + "20" },
              ]}
            >
              <IconSymbol
                name="checkmark.circle"
                size={24}
                color={colors.primaryGradientEnd}
              />
            </View>
            <Text
              style={[styles.statValue, { color: colors.primaryGradientEnd }]}
            >
              {stats.averageAccuracy}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Accuracy
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <IconSymbol name="clock" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {formatTime(stats.totalStudyTime)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Study Time
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.success + "20" },
              ]}
            >
              <IconSymbol name="flame" size={20} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats.studyStreak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Day Streak
            </Text>
          </View>
        </View>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Active Decks</ThemedText>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.infoText, { color: colors.text }]}>
              You have {stats.totalDecks} deck
              {stats.totalDecks !== 1 ? "s" : ""} to study
            </Text>
          </View>
        </ThemedView>
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
    fontWeight: "bold",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
  },
  largeCard: {
    width: "47%",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 16,
  },
});
