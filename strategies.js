/**
 * Calculates the lot size based on account balance and risk percentage.
 *
 */
function calculatePositionSize(balance, riskPercent, entry, sl) {
    if (!entry || !sl || entry === sl) return "0.00";

    const riskAmount = balance * (riskPercent / 100);
    const pipsAtRisk = Math.abs(entry - sl);
    
    // Simple lot calculation: Risk Amount / Distance
    const rawLots = riskAmount / pipsAtRisk;
    
    // Return formatted to 2 decimal places for the UI
    return isFinite(rawLots) ? rawLots.toFixed(2) : "0.00";
}
