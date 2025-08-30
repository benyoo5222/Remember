import { StorageService } from "@/services/storage";
import * as Haptics from "expo-haptics";

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type NotificationType = "success" | "warning" | "error";

const hapticStyleMap: Record<HapticStyle, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
  soft: Haptics.ImpactFeedbackStyle.Soft,
};

const notificationTypeMap: Record<NotificationType, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

/**
 * Centralized haptic feedback utility that respects user settings
 */
export const triggerHaptic = async (
  style: HapticStyle | Haptics.ImpactFeedbackStyle = "medium"
) => {
  try {
    const settings = await StorageService.getSettings();

    if (settings.hapticEnabled) {
      const hapticStyle =
        typeof style === "string" ? hapticStyleMap[style] : style;
      await Haptics.impactAsync(hapticStyle);
    }
  } catch (error) {
    // Silently fail if haptics are not available or there's an error
    console.log("Haptic feedback error:", error);
  }
};

/**
 * Trigger notification haptic feedback (respects user settings)
 */
export const triggerNotification = async (
  type: NotificationType | Haptics.NotificationFeedbackType = "success"
) => {
  try {
    const settings = await StorageService.getSettings();
    if (settings.hapticEnabled) {
      const notificationType = typeof type === "string" ? notificationTypeMap[type] : type;
      await Haptics.notificationAsync(notificationType);
    }
  } catch (error) {
    console.log("Haptic notification error:", error);
  }
};
