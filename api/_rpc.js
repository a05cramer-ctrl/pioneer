// Solana JSON-RPC. HELIUS_API_KEY (Vercel env var) if set, else SOLANA_RPC, else the public endpoint.
const URL_ = process.env.HELIUS_API_KEY ? "https://mainnet.helius-rpc.com/?api-key=" + process.env.HELIUS_API_KEY
  : (process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com");
async function rpc(method, params) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(URL_, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    if (r.status === 429) { await new Promise(s => setTimeout(s, 600 * (i + 1))); continue; }
    const j = await r.json();
    if (j.error) throw new Error(method + ": " + (j.error.message || "rpc error"));
    return j.result;
  }
  throw new Error(method + ": rate limited");
}
const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const launchCache = {};
// The mint's first transaction = the coin's launch. Pages back through the mint's history (cached per instance).
async function launchTime(mint) {
  if (launchCache[mint]) return launchCache[mint];
  let before, oldest = null;
  for (let i = 0; i < 40; i++) {
    const s = await rpc("getSignaturesForAddress", [mint, before ? { limit: 1000, before } : { limit: 1000 }]);
    if (!s.length) break;
    oldest = s[s.length - 1]; before = oldest.signature;
    if (s.length < 1000) { if (oldest.blockTime) launchCache[mint] = oldest.blockTime; return oldest.blockTime || null; }
  }
  return null; // history too long to page here: set LAUNCH_TIME in config.js
}
module.exports = { rpc, B58, launchTime };
