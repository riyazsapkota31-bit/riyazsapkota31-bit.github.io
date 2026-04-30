/**
 * OMNI-TRADER RISK ENGINE
 * Ensures position sizing is 100% accurate based on entry/SL distance.
 */
function calculatePositionSize(balance, riskPercent, entry, sl) {
    if (!entry || !sl || entry === sl) return "0.00";
    
    // Total USD amount willing to lose
    const riskAmount = balance * (riskPercent / 100);
    
    // Price distance between entry and stop loss
    const distance = Math.abs(entry - sl);
    
    // Position size calculation
    const lotSize = riskAmount / distance;
    
    return isFinite(lotSize) ? lotSize.toFixed(2) : "0.00";
}
