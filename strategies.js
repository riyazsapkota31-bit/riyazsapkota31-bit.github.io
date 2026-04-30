const TRADING_BRAIN = [
    {
        category: "Institutional Order Flow (SMC/ICT)",
        logic: "Analyze 4H for Market Structure. Identify Break of Structure (BOS) and Change of Character (CHoCH). Look for unmitigated Order Blocks (OB) and Fair Value Gaps (FVG). On 1H, identify liquidity sweeps (Buy-side/Sell-side). On 15M, wait for a displacement away from the 1H FVG and enter on the retest of the new 15M FVG."
    },
    {
        category: "ICT Power of 3 (Accumulation/Manipulation/Distribution)",
        logic: "Identify the Asian Range consolidation (Accumulation). Look for the London Session 'Judas Swing' sweep below/above the Asian range (Manipulation). Use the NY Session to trade the true trend direction (Distribution). Only enter when 15M shows a Market Structure Shift (MSS) after the sweep."
    },
    {
        category: "Supply & Demand Zone Flipping",
        logic: "Mark 4H 'Rally-Base-Drop' or 'Drop-Base-Rally' zones. On 1H, check if a Supply zone has failed and 'flipped' into a Demand zone (S/D Flip). Entry on 15M must show a rejection wick or an engulfing candle confirming the zone holds."
    },
    {
        category: "Multi-Timeframe Trend Confluence",
        logic: "4H must be trending (HL/HH). 1H must provide a pullback to the 0.5 - 0.618 Fibonacci 'Ote' (Optimal Trade Entry) zone. 15M must show a breakout of the counter-trend line with high volume/displacement."
    },
    {
        category: "Liquidity & Inducement",
        logic: "Identify 'Equal Highs' or 'Equal Lows' on 1H as target liquidity. Identify the 'Inducement' high/low that traps retail traders before the real move. Only enter after the inducement has been cleared and the 15M timeframe shows a strong rejection."
    }
];
