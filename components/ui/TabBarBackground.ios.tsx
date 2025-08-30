import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export default function BlurTabBarBackground() {
  // Temporarily disable background completely to debug white overlays
  return null;

  // Original blur implementation (commented out for debugging)
  // return (
  //   <BlurView
  //     tint="systemChromeMaterial"
  //     intensity={100}
  //     style={StyleSheet.absoluteFill}
  //   />
  // );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
