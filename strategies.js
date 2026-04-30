/**
 * Calculates accurate Lot Size based on risk percentage and SL distance.
 */
function calculatePositionSize(balance, riskPercent, entry, sl) {
    if (!entry || !sl || entry === sl) return "0.00";
    
    // Risk amount in USD
    const riskAmount = balance * (riskPercent / 100);
    
    // Price distance
    const distance = Math.abs(entry - sl);
    
    // Lot Size calculation
    const lotSize = riskAmount / distance;
    
    return isFinite(lotSize) ? lotSize.toFixed(2) : "0.00";
}
