// GET /api/launch?mint=<CA>  ->  { launchTs }  (unix seconds of the mint's first transaction)
const { B58, launchTime } = require("./_rpc");
module.exports = async (req, res) => {
  const mint = String(req.query.mint || "");
  if (!B58.test(mint)) return res.status(400).json({ error: "bad mint" });
  try {
    const t = await launchTime(mint);
    if (t) res.setHeader("Cache-Control", "public, s-maxage=86400");
    res.status(200).json({ launchTs: t });
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
};
