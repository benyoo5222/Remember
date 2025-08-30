import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StorageService } from "@/services/storage";
import { triggerHaptic } from "@/utils/haptics";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [hapticEnabled, setHapticEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await StorageService.getSettings();
    setHapticEnabled(settings.hapticEnabled);
  };

  const handleHapticToggle = async (value: boolean) => {
    setHapticEnabled(value);
    await StorageService.updateSettings({ hapticEnabled: value });
    if (value) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all your decks, cards, and progress. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await StorageService.clearAllData();
            Alert.alert("Success", "All data has been cleared.");
          },
        },
      ]
    );
  };

  const handleResetSampleData = async () => {
    await StorageService.clearAllData();
    await StorageService.initializeSampleData();
    Alert.alert("Success", "Tutorial deck has been restored.");
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          opacity: pressed && onPress ? 0.7 : 1,
        },
      ]}
      onPress={async () => {
        if (onPress) {
          await triggerHaptic();
          onPress();
        }
      }}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingLeft}>
        <IconSymbol
          name={icon}
          size={24}
          color={colors.primary}
          style={styles.settingIcon}
        />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement ||
        (onPress && (
          <IconSymbol name="chevron.right" size={20} color={colors.icon} />
        ))}
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Settings
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Preferences
          </ThemedText>

          <SettingRow
            icon="hand.tap.fill"
            title="Haptic Feedback"
            subtitle="Vibration on interactions"
            rightElement={
              <Switch
                value={hapticEnabled}
                onValueChange={handleHapticToggle}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
              />
            }
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Data
          </ThemedText>

          <SettingRow
            icon="arrow.counterclockwise"
            title="Reset to Tutorial"
            subtitle="Restore to the tutorial deck (delete all decks and progress)"
            onPress={handleResetSampleData}
          />

          <SettingRow
            icon="trash.fill"
            title="Clear All Data"
            subtitle="Delete all decks and progress"
            onPress={handleClearData}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            About
          </ThemedText>

          <SettingRow
            icon="info.circle.fill"
            title="Version"
            subtitle="1.0.0"
          />
        </ThemedView>

        <View style={{ height: 100 }} />
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
