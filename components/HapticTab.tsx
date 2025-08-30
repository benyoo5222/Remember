import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { triggerHaptic } from "@/utils/haptics";

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={async (ev) => {
        await triggerHaptic();
        props.onPressIn?.(ev);
      }}
    />
  );
}
