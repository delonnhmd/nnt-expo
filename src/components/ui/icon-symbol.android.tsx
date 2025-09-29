import { View, StyleProp, ViewStyle } from 'react-native';

export function IconSymbol({
  size = 24,
  color,
  style,
}: {
  name?: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ width: size, height: size, backgroundColor: 'transparent' }, style]} />;
}
export default IconSymbol;
