const TRADING_BRAIN = [
    {
        category: "Safety Filter",
        logic: "NEVER trade during 'Red Folder' news or high-volatility spikes. If DXY and the Asset are moving in the same direction, it is a 'High Risk' trap—stay out."
    },
    {
        category: "Institutional Bias",
        logic: "Identify the 4H Trend. Only look for BUYs in an uptrend and SELLs in a downtrend. If price is in the middle of a range (Fair Value), it is a 'No-Trade' zone."
    },
    {
        category: "Precision Entry",
        logic: "Wait for a 15M 'Liquidity Sweep' (price takes out a recent high/low and reverses). Enter only on a 1H Fair Value Gap (FVG) or Order Block (OB) touch."
    },
    {
        category: "Hard Risk Math",
        logic: "Minimum Risk/Reward is 1:2. Place the Stop Loss (SL) strictly below the candle that caused the market structure shift. If the SL is too wide (>3% price move), skip the trade."
    }
];
