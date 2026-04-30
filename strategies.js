/**
 * OMNI-TRADER CORE ACCURACY ENGINE
 * This file handles the mathematical precision for lot sizing.
 */

function calculatePositionSize(balance, riskPercent, entry, sl) {
    if (!entry || !sl || entry === sl) return "0.00";
    
    // Calculate dollar amount at risk
    const riskAmount = balance * (riskPercent / 100);
    
    // Calculate absolute price distance
    const distance = Math.abs(entry - sl);
    
    // Final Lot Calculation
    const lotSize = riskAmount / distance;
    
    return isFinite(lotSize) ? lotSize.toFixed(2) : "0.00";
}
