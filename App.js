// App.jsx
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";
import { useMemo, useState } from "react";
import { Alert, Button, SafeAreaView, ScrollView, Share, Text, TextInput, View } from "react-native";

// ======= CONFIG (edit these) =======
const BACKEND = "https://<your-public-backend-domain>/";
const WC_PROJECT_ID = "<YOUR_WALLETCONNECT_PROJECT_ID>"; // from WalletConnect Cloud
const CHAIN_ID = 11155111;        // Sepolia
const CHAIN_HEX = "0xaa36a7";
const RPC_URL  = "https://eth-sepolia.g.alchemy.com/v2/_3_-olRoOtcB_dXWsogSb";
// ===================================

let wcProv; // singleton WC provider

async function getWcProvider() {
  if (wcProv) return wcProv;
  wcProv = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    showQrModal: true,
    chains: [CHAIN_ID],
    rpcMap: { [CHAIN_ID]: RPC_URL },
    methods: [
      "eth_sendTransaction",
      "eth_sign",
      "personal_sign",
      "eth_signTypedData",
      "eth_signTypedData_v4",
      "wallet_switchEthereumChain",
      "wallet_addEthereumChain",
    ],
    events: ["connect","disconnect","chainChanged","accountsChanged"],
    qrModalOptions: { themeMode: "dark" },
  });

  // ensure Sepolia
  try {
    await wcProv.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch {
    await wcProv.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: CHAIN_HEX,
        chainName: "Sepolia",
        nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
        rpcUrls: [RPC_URL],
        blockExplorerUrls: ["https://sepolia.etherscan.io"],
      }]
    });
  }
  return wcProv;
}

export default function App() {
  const [addr, setAddr] = useState("");              // holds connected wallet address (or manual fallback)
  const [connected, setConnected] = useState(false);
  const [chain, setChain] = useState(null);

  const [postId, setPostId] = useState("1001");
  const [topic, setTopic] = useState("General");
  const [content, setContent] = useState("Hello NNT!");
  const [log, setLog] = useState("");
  const [feed, setFeed] = useState([]);
  const [streak, setStreak] = useState(1);

  const append = (s) => setLog((p) => s + "\n" + p);

  // WalletConnect connect/disconnect
  const connect = async () => {
    try {
      const p = await getWcProvider();
      const accs = await p.enable();
      const chainId = await p.request({ method: "eth_chainId" });
      setAddr(accs[0]);
      setChain(chainId);
      setConnected(true);
      append(`Connected: ${accs[0]} on ${chainId}`);
    } catch (e) {
      append(`connect error: ${String(e)}`);
    }
  };
  const disconnect = async () => {
    try { await wcProv?.disconnect(); } catch {}
    setConnected(false); setAddr(""); setChain(null);
  };

  // Ethers signer from WC
  const signer = useMemo(() => {
    if (!connected) return null;
    const bp = new ethers.BrowserProvider(wcProv, CHAIN_ID);
    return bp.getSigner();
  }, [connected]);

  const ensureAddr = () => {
    if (!addr?.startsWith("0x")) { Alert.alert("Connect wallet first"); return false; }
    return true;
  };

  // JSON helpers
  const jfetch = async (url, method="GET", body=null) => {
    const opt = { method, headers: { "Content-Type": "application/json" } };
    if (body) opt.body = JSON.stringify(body);
    const r = await fetch(url, opt);
    const t = await r.text();
    let j = {};
    try { j = JSON.parse(t); } catch { j = { raw: t }; }
    if (!r.ok) throw new Error(j.error || t || "request failed");
    return j;
  };

  // -------- REGISTER (nonce/sign/verify) --------
  const onRegister = async () => {
    if (!ensureAddr()) return;
    try {
      const { nonce } = await jfetch(`${BACKEND}/auth/nonce?address=${addr}`);
      const sig = await (await signer).signMessage(nonce);
      const v = await jfetch(`${BACKEND}/auth/verify`, "POST", { address: addr, signature: sig });
      append(`Registered: ${JSON.stringify(v)}`);
    } catch (e) {
      append(`register error: ${String(e)}`);
    }
  };

  // ---- Create Post (prepared-tx from backend, then send with wallet) ----
  const onCreatePost = async () => {
    if (!ensureAddr()) return;
    const pid = parseInt(postId);
    const prep = await jfetch(`${BACKEND}/tx/post/create`, "POST", { from: addr, postId: pid });
    // (optional) send approve for NNT if needed; skipping for speed in this test screen
    const tx = await (await signer).sendTransaction(prep);
    const rc = await tx.wait();
    append(`createPost tx: ${rc.hash || "(mined)"}`);
    setFeed((f) => [{ id: pid, topic, content }, ...f]);
  };

  // ---- Vote TRUE / FAKE
  const onVote = async (sideTrue) => {
    if (!ensureAddr()) return;
    const pid = parseInt(postId);
    const prep = await jfetch(`${BACKEND}/tx/vote`, "POST", { from: addr, postId: pid, sideTrue });
    const tx = await (await signer).sendTransaction(prep);
    const rc = await tx.wait();
    append(`vote ${sideTrue ? "TRUE" : "FAKE"}: ${rc.hash || "(mined)"}`);
  };

  // ---- Register View (watch content)
  const onRegisterView = async () => {
    if (!ensureAddr()) return;
    const pid = parseInt(postId);
    const prep = await jfetch(`${BACKEND}/tx/view/register`, "POST", { from: addr, postId: pid });
    const tx = await (await signer).sendTransaction(prep);
    const rc = await tx.wait();
    append(`registerView: ${rc.hash || "(mined)"}`);
  };

  // ---- Ad reward (legacy pool) — server-signed call
  const onAdWatch = async () => {
    if (!ensureAddr()) return;
    const j = await jfetch(`${BACKEND}/ad/view`, "POST", { viewer: addr });
    append(`ad view rewarded: ${JSON.stringify(j)}`);
  };

  // ---- Claim rewards (TRUE voter GNNT) via prepared tx -> wallet send
  const onClaimTrue = async () => {
    if (!ensureAddr()) return;
    const pid = parseInt(postId);
    const prep = await jfetch(`${BACKEND}/tx/claim/true`, "POST", { from: addr, postId: pid });
    const tx = await (await signer).sendTransaction(prep);
    const rc = await tx.wait();
    append(`claimTrueVoterGNNT: ${rc.hash || "(mined)"}`);
  };

  // ---- Pay gap fee (NNT) via prepared tx -> wallet send
  const onPayGap = async () => {
    if (!ensureAddr()) return;
    const pid = parseInt(postId);
    const prep = await jfetch(`${BACKEND}/tx/gap/pay`, "POST", { from: addr, postId: pid });
    const tx = await (await signer).sendTransaction(prep);
    const rc = await tx.wait();
    append(`payGapFee: ${rc.hash || "(mined)"}`);
  };

  // ---- Inspector
  const onInspect = async () => {
    const pid = parseInt(postId);
    const s = await jfetch(`${BACKEND}/post/${pid}/state`);
    append(`Post ${pid} state:\n${JSON.stringify(s, null, 2)}`);
  };

  // ---- Balances (uses backend /balance helper)
  const onBalance = async (token) => {
    if (!ensureAddr()) return;
    const b = await jfetch(`${BACKEND}/balance?token=${token}&address=${addr}`);
    append(`${token.toUpperCase()} balance: ${JSON.stringify(b)}`);
  };

  // ---- Airdrop (server-claim for speed; you can switch to client-claim later)
  const onAirdropClaim = async (token, epoch) => {
    if (!ensureAddr()) return;
    try {
      const cl = await jfetch(`${BACKEND}/airdrop/claimable?token=${token}&epoch=${epoch}&address=${addr}`);
      append(`Claimable ${token} @ epoch ${epoch}: ${JSON.stringify(cl)}`);
    } catch {}
    const r = await jfetch(`${BACKEND}/airdrop/claim-server`, "POST", { token, epoch, address: addr });
    append(`Airdrop ${token}: ${JSON.stringify(r)}`);
  };

  // ---- Referral + Share
  const onReferral = async () => {
    if (!ensureAddr()) return;
    const j = await jfetch(`${BACKEND}/ref/link?address=${addr}`);
    append(`Referral: ${j.link}`);
    try { await Share.share({ message: `Join me on NNT: ${j.link}` }); } catch {}
  };

  // ---- 7-day quest UI
  const quest = useMemo(() => (
    <View style={{ flexDirection:"row", marginVertical:6 }}>
      {[1,2,3,4,5,6,7].map(i=>(
        <View key={i} style={{ flex:1, height:10, marginHorizontal:2, borderRadius:4, backgroundColor: i<=streak ? "#4ade80" : "#e5e7eb" }} />
      ))}
    </View>
  ), [streak]);

  return (
    <SafeAreaView style={{ flex:1, padding:14 }}>
      <Text style={{ fontSize:20, fontWeight:"700" }}>NNT/GNNT — Sepolia Test Hub</Text>
      <Text selectable>Backend: {BACKEND}</Text>
      <Text selectable>RPC: {RPC_URL}</Text>

      {/* Connect / Register */}
      <View style={{ marginTop:10, flexDirection:"row", flexWrap:"wrap", gap:8 }}>
        <Button title={connected ? "Connected" : "Connect Wallet"} onPress={connect} />
        <Button title="Disconnect" onPress={disconnect} />
        <Button title="Register" onPress={onRegister} />
      </View>
      <Text style={{ marginTop:6 }} selectable>Account: {addr || "(not connected)"} · Chain: {chain || "-"}</Text>

      {/* Quest */}
      <View style={{ marginTop:12 }}>
        <Text style={{ fontWeight:"600" }}>7-day Quest</Text>
        {quest}
        <View style={{ flexDirection:"row", gap:8 }}>
          <Button title="Mark Today Done" onPress={() => setStreak((s)=> Math.min(7, s+1))} />
          <Button title="Reset" onPress={() => setStreak(1)} />
        </View>
      </View>

      {/* Post composer */}
      <View style={{ marginTop:14 }}>
        <Text style={{ fontWeight:"600" }}>Post Composer</Text>
        <TextInput placeholder="Post ID" value={postId} onChangeText={setPostId} keyboardType="numeric"
          style={{ borderWidth:1, borderRadius:8, padding:10, marginTop:6 }} />
        <TextInput placeholder="Topic" value={topic} onChangeText={setTopic}
          style={{ borderWidth:1, borderRadius:8, padding:10, marginTop:6 }} />
        <TextInput placeholder="Content" value={content} onChangeText={setContent}
          style={{ borderWidth:1, borderRadius:8, padding:10, marginTop:6 }} />
        <View style={{ flexDirection:"row", flexWrap:"wrap", rowGap:8, columnGap:8, marginTop:8 }}>
          <Button title="Create Post" onPress={onCreatePost} />
          <Button title="Vote TRUE" onPress={() => onVote(true)} />
          <Button title="Vote FAKE" onPress={() => onVote(false)} />
          <Button title="Register View" onPress={onRegisterView} />
          <Button title="Ad: Watch Reward" onPress={onAdWatch} />
        </View>
      </View>

      {/* Claims / Balances */}
      <View style={{ marginTop:14 }}>
        <Text style={{ fontWeight:"600" }}>Claims & Balances</Text>
        <View style={{ flexDirection:"row", flexWrap:"wrap", rowGap:8, columnGap:8, marginTop:6 }}>
          <Button title="Claim TRUE (GNNT)" onPress={onClaimTrue} />
          <Button title="Pay Gap (NNT)" onPress={onPayGap} />
          <Button title="Airdrop NNT (100)" onPress={() => onAirdropClaim("nnt", 100)} />
          <Button title="Airdrop NNT (101)" onPress={() => onAirdropClaim("nnt", 101)} />
          <Button title="Airdrop GNNT (200)" onPress={() => onAirdropClaim("gnnt", 200)} />
          <Button title="NNT Balance" onPress={() => onBalance("nnt")} />
          <Button title="GNNT Balance" onPress={() => onBalance("gnnt")} />
        </View>
      </View>

      {/* Inspector & Feed */}
      <View style={{ marginTop:14 }}>
        <Text style={{ fontWeight:"600" }}>Post Inspector & Feed</Text>
        <View style={{ flexDirection:"row", gap:8, marginTop:6 }}>
          <Button title="Inspect Post" onPress={onInspect} />
          <Button title="Referral / Share" onPress={onReferral} />
        </View>
        <ScrollView style={{ maxHeight:160, borderWidth:1, borderRadius:8, marginTop:6, padding:8 }}>
          {feed.length===0 ? <Text style={{ color:"#666" }}>No posts yet.</Text> :
            feed.map(p=>(
              <View key={p.id} style={{ paddingVertical:6, borderBottomWidth:0.5 }}>
                <Text style={{ fontWeight:"700" }}>#{p.id} · {p.topic}</Text>
                <Text>{p.content}</Text>
              </View>
            ))
          }
        </ScrollView>
      </View>

      {/* Log */}
      <Text style={{ marginTop:10, fontWeight:"700" }}>Log</Text>
      <ScrollView style={{ flex:1, borderWidth:1, borderRadius:8, marginTop:6, padding:8 }}>
        <Text selectable style={{ fontFamily:"monospace" }}>{log}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
