window.PIONEER_CFG = {
  NAME: "PIONEER",
  TICKER: "PIONEER",
  CA: "",
  CHAIN: "elysium",
  PAD: "",
  X: "",
  BUY: "",
  CHART: "",
  SITE: "",                  // public site URL used in share posts (falls back to the current page)

  // Network the page reads. Switch to "mainnet" and fill MAINNET_RPC once Elysium mainnet's public RPC is published.
  NETWORK: "mainnet",
  MAINNET_RPC: "https://rpc.elysium.kinetiq.xyz",   // chain 99901, CORS open
  MAINNET_CHAIN_ID: 99901,
  MAINNET_EXPLORER: "",
  TESTNET_RPC: "https://testnet-rpc.elysium.kinetiq.xyz",
  TESTNET_CHAIN_ID: 99801,
  TESTNET_EXPLORER: "https://explorer-elysium-testnet.t.conduit.xyz",

  // The 24-hour window. Set WINDOW_START (ISO, UTC) to the moment Elysium mainnet opens to the public.
  WINDOW_START: "",          // e.g. "2026-11-09T15:00:00Z"
  WINDOW_START_BLOCK: 0,     // optional: first block of the window (found automatically from WINDOW_START if 0)
  WINDOW_END_BLOCK: 0,       // optional: first block after the window
  WINDOW_HOURS: 24,

  // Rules
  MIN_TX: 3,            // transactions a wallet must send inside the window
  AIRDROP_PCT: 20,      // % of $PIONEER supply split equally across every eligible wallet
  TOTAL_SUPPLY: 1000000000
};
