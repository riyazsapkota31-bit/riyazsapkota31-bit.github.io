/**
 * OMNI-TRADER RISK ENGINE
 * Precise lot sizing based on SL distance.
 */
function calculatePositionSize(balance, riskPercent, entry, sl) {
    if (!entry || !sl || entry === sl) return "0.00";
    
    // Amount to lose in USD
    const riskUSD = balance * (riskPercent / 100);
    
    // Total price distance
    const distance = Math.abs(entry - sl);
    
    // Standard sizing
    const rawLots = riskUSD / distance;
    
    // Return formatted for UI
    return isFinite(rawLots) ? rawLots.toFixed(2) : "0.00";
}
