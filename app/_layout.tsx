// nnt-expo/app/_layout.tsx
import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-compat'; // MUST be first — ensures native shims are registered

export default function Layout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Slot />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
