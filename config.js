window.PIONEER_CFG = {
  NAME: "PIONEER",
  TICKER: "PIONEER",
  CA: "",                    // pump.fun mint. Empty = pre-launch (checker says "not live yet", sky shows every new pump.fun launch)
  X: "",
  BUY: "",                   // optional; defaults to https://pump.fun/coin/<CA>
  SITE: "",                  // public site URL used in share posts (falls back to the current page)

  // The window: first WINDOW_HOURS after launch. Leave LAUNCH_TIME empty to read it from the mint's first transaction.
  LAUNCH_TIME: "",           // e.g. "2026-11-11T15:00:00Z"
  WINDOW_HOURS: 24,

  // Rules
  MIN_BUY_SOL: 0.1,          // SOL a wallet must put in during the window
  AIRDROP_PCT: 20,           // % of supply split equally across every eligible wallet (must be held by the dev wallet)
  TOTAL_SUPPLY: 1000000000
};
