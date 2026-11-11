// GET /api/buys?mint=<CA>  ->  { buys: [{ sig, wallet, sol, t }] }  latest buys, newest first.
// A buy = the signer's balance of the coin goes up while its SOL (native + wrapped) goes down. Edge-cached 4 s.
const { rpc, B58 } = require("./_rpc");
const WSOL = "So11111111111111111111111111111111111111112";
module.exports = async (req, res) => {
  const mint = String(req.query.mint || "");
  if (!B58.test(mint)) return res.status(400).json({ error: "bad mint" });
  try {
    const sigs = (await rpc("getSignaturesForAddress", [mint, { limit: 15 }])).filter(s => !s.err);
    const txs = await Promise.all(sigs.map(s => rpc("getTransaction", [s.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 1, commitment: "confirmed" }]).catch(() => null)));
    const buys = [];
    txs.forEach((tx, i) => {
      if (!tx || !tx.meta || tx.meta.err) return;
      const keys = tx.transaction.message.accountKeys.map(k => (typeof k === "string" ? k : k.pubkey));
      const w = keys[0];
      const bal = (l, m) => (l || []).filter(b => b.owner === w && b.mint === m).reduce((s, b) => s + Number(b.uiTokenAmount.uiAmountString || 0), 0);
      const dTok = bal(tx.meta.postTokenBalances, mint) - bal(tx.meta.preTokenBalances, mint);
      const dSol = (tx.meta.preBalances[0] - tx.meta.postBalances[0]) / 1e9 + bal(tx.meta.preTokenBalances, WSOL) - bal(tx.meta.postTokenBalances, WSOL);
      if (dTok > 0 && dSol > 0.001) buys.push({ sig: sigs[i].signature, wallet: w, sol: Math.round(dSol * 1e4) / 1e4, t: sigs[i].blockTime });
    });
    res.setHeader("Cache-Control", "public, s-maxage=4, stale-while-revalidate=4");
    res.status(200).json({ buys });
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
};
