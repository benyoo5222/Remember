// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'square.stack.3d.up.fill': 'view-module',
  'brain': 'psychology',
  'chart.bar.fill': 'bar-chart',
  'gearshape.fill': 'settings',
  'plus': 'add',
  'plus.circle': 'add-circle',
  'rectangle.stack.fill': 'layers',
  'shuffle': 'shuffle',
  'clock.arrow.circlepath': 'refresh',
  'clock': 'schedule',
  'hand.tap.fill': 'touch-app',
  'speaker.wave.2.fill': 'volume-up',
  'timer': 'schedule',
  'arrow.down.doc.fill': 'download',
  'arrow.up.doc.fill': 'upload',
  'trash.fill': 'delete',
  'trash': 'delete',
  'info.circle.fill': 'info',
  'questionmark.circle.fill': 'help',
  'arrow.counterclockwise': 'undo',
  'xmark': 'close',
  'pencil': 'edit',
  'checkmark': 'check',
  'checkmark.circle': 'check-circle',
  'play.fill': 'play-arrow',
  'flame': 'local-fire-department',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
