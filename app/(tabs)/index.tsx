import { GNNT_ADDRESS, GNNT_DECIMALS, NNT_ADDRESS, NNT_DECIMALS } from '@/constants';
import { WalletConnectUI, useBackend, useRegistration, useTokenBalance, useWallet } from '@/hooks';
import { shortAddr } from '@/utils/format';
import { Text, View } from 'react-native';


const BACKEND = process.env.EXPO_PUBLIC_BACKEND ?? 'http://127.0.0.1:8082';
const RPC_URL = process.env.EXPO_PUBLIC_RPC_URL!;
const WC_PROJECT_ID = process.env.EXPO_PUBLIC_WC_PROJECT_ID!;


export default function Home() {
  const { connected, address, chainId, connect, disconnect, signMessage } = useWallet();
  const { airdropNnt, airdropGnnt, claimTrue, payGap } = useBackend();

  const { register, registered, loading: regLoading, lastError: regError, status } =
    useRegistration({ address, signMessage });

  const nnt = useTokenBalance({ token: NNT_ADDRESS, address, decimals: NNT_DECIMALS, pollMs: 15000 });
  const gnnt = useTokenBalance({ token: GNNT_ADDRESS, address, decimals: GNNT_DECIMALS, pollMs: 15000 });

  return (
    <>
      <View style={{ padding: 12 }}>
        <Text style={{ fontWeight: '600' }}>{connected ? `Address: ${shortAddr(address)}` : 'Not connected'}</Text>
      </View>
      <WalletConnectUI />
      {/* header showing BACKEND/RPC */}
      {/* CONNECT / DISCONNECT buttons -> connect()/disconnect() */}
      {/* REGISTER -> register() (render status / errors) */}
      {/* BALANCE buttons -> just show nnt.formatted / gnnt.formatted and a Refresh button calling nnt.refresh()/gnnt.refresh() */}
      {/* CLAIM TRUE -> claimTrue(address!) */}
      {/* PAY GAP -> payGap(address!) */}
      {/* AIRDROP NNT(100)/(101) -> airdropNnt(address!, 100 or 101) */}
      {/* AIRDROP GNNT(200) -> airdropGnnt(address!, 200) */}
    </>
  );
}
