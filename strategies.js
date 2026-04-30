/**
 * OMNI-TRADER RISK ENGINE
 * Handles real-time position sizing based on chart extraction.
 */

function calculatePositionSize(balance, riskPercent, entry, sl) {
    if (!entry || !sl || entry === sl) return "0.00";
    
    // Risk amount in Dollars
    const riskAmount = balance * (riskPercent / 100);
    
    // Calculate distance in price units (pips/points)
    const distance = Math.abs(entry - sl);
    
    // Final Lot Calculation
    const lotSize = riskAmount / distance;
    
    return isFinite(lotSize) ? lotSize.toFixed(2) : "0.00";
}

// Logic for finding confluence across timeframes
function getConfluenceLabel(dxyBias, h4Bias, m15Structure) {
    if (dxyBias === 'Bearish' && h4Bias === 'Bullish') return "High Probability Buy";
    if (dxyBias === 'Bullish' && h4Bias === 'Bearish') return "High Probability Sell";
    return "Neutral / Wait for Confirmation";
}
