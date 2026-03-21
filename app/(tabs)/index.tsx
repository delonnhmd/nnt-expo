import { Redirect } from 'expo-router';

// Gold Penny home — redirect directly into the gameplay dashboard.
// (Legacy NNT post-feed home is archived at archive/nnt-legacy/nnt-expo-nnt-only/app-routes/index_nnt_original.tsx)
export default function HomeTab() {
  return <Redirect href="/gameplay" />;
}
