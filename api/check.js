// GET /api/check?wallet=&mint=&min=0.1&hours=24[&start=unix]
// A wallet qualifies when the SOL it put into $PIONEER buys inside the window adds up to `min` or more
// and it still holds $PIONEER now (the final list is taken at the close with the same rule).
// Buys are read from the wallet's own token-account history: token balance up + SOL down in the same tx.
const { rpc, B58, launchTime } = require("./_rpc");
const WSOL = "So11111111111111111111111111111111111111112";

module.exports = async (req, res) => {
  const wallet = String(req.query.wallet || ""), mint = String(req.query.mint || "");
  const min = Math.max(0, Number(req.query.min) || 0.1), hours = Math.min(72, Math.max(1, Number(req.query.hours) || 24));
  if (!B58.test(wallet) || !B58.test(mint)) return res.status(400).json({ error: "bad address" });
  try {
    const start = Number(req.query.start) || await launchTime(mint);
    if (!start) return res.status(503).json({ error: "launch time unknown" });
    const end = start + hours * 3600;

    const ta = await rpc("getTokenAccountsByOwner", [wallet, { mint }, { encoding: "jsonParsed", commitment: "confirmed" }]);
    const accts = (ta.value || []).map(a => ({ pk: a.pubkey, amt: Number(a.account.data.parsed.info.tokenAmount.uiAmountString || 0) }));
    const holding = accts.reduce((s, a) => s + a.amt, 0);

    // signatures that touched the wallet's $PIONEER account(s) inside the window
    let sigs = [];
    for (const a of accts) {
      let before;
      for (let p = 0; p < 5; p++) {
        const page = await rpc("getSignaturesForAddress", [a.pk, before ? { limit: 1000, before } : { limit: 1000 }]);
        if (!page.length) break;
        for (const s of page) if (!s.err && s.blockTime >= start && s.blockTime < end) sigs.push(s.signature);
        before = page[page.length - 1].signature;
        if (page.length < 1000 || page[page.length - 1].blockTime < start) break;
      }
    }
    sigs = [...new Set(sigs)].slice(0, 60);

    let solIn = 0, buys = 0;
    for (let i = 0; i < sigs.length; i += 8) {
      const txs = await Promise.all(sigs.slice(i, i + 8).map(sig =>
        rpc("getTransaction", [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 1, commitment: "confirmed" }]).catch(() => null)));
      for (const tx of txs) {
        if (!tx || !tx.meta || tx.meta.err) continue;
        const bal = (list, m) => (list || []).filter(b => b.owner === wallet && b.mint === m).reduce((s, b) => s + Number(b.uiTokenAmount.uiAmountString || 0), 0);
        const dTok = bal(tx.meta.postTokenBalances, mint) - bal(tx.meta.preTokenBalances, mint);
        const keys = tx.transaction.message.accountKeys.map(k => (typeof k === "string" ? k : k.pubkey));
        const idx = keys.indexOf(wallet);
        // SOL out = native lamports + wrapped SOL the wallet spent in the same tx
        const dSol = (idx >= 0 ? (tx.meta.preBalances[idx] - tx.meta.postBalances[idx]) / 1e9 : 0)
          + bal(tx.meta.preTokenBalances, WSOL) - bal(tx.meta.postTokenBalances, WSOL);
        if (dTok > 0 && dSol > 0) { buys++; solIn += dSol; }
      }
    }
    solIn = Math.round(solIn * 1e4) / 1e4;
    const now = Math.floor(Date.now() / 1000);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ wallet, start, end, phase: now < end ? "open" : "closed", holding: holding > 0, balance: holding, buys, solIn, eligible: solIn >= min && holding > 0 });
  } catch (e) {
    const m = String(e.message || e);
    res.status(502).json({ error: /getTokenAccountsByOwner/.test(m) && !process.env.HELIUS_API_KEY ? "Set HELIUS_API_KEY in Vercel" : m });
  }
};
