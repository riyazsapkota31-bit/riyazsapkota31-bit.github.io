// ========================= strategies.js =========================
// OMNI-BLACK V2.0 – Full Multi‑Strategy Trading Engine
// Strategies: SMC (OB, FVG, Liquidity Sweep, MSS), Supply & Demand,
// Support & Resistance, BOS + Retest, Fibonacci Retracement, Spread filter.
// =================================================================

class StrategyEngine {
    // ---------- Helper: RSI ----------
    static calcRSI(prices, period = 14) {
        if (!prices || prices.length < period + 1) return 50;
        let gains = 0, losses = 0;
        for (let i = prices.length - period; i < prices.length; i++) {
            let diff = prices[i] - prices[i - 1];
            if (diff >= 0) gains += diff;
            else losses -= diff;
        }
        let avgGain = gains / period, avgLoss = losses / period;
        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    // ---------- Strategy 1: SMC (Smart Money Concepts) ----------
    // Includes: MSS, Order Block, FVG, Liquidity Sweep
    static evaluateSMC(data) {
        let score = 0;
        let reasons = [];
        const { mss, liquiditySweep, ob_level, fvg_level, currentPrice } = data;

        if (mss === "BULLISH") {
            score += 30;
            reasons.push("Bullish MSS (market structure shift)");
            if (liquiditySweep && currentPrice > liquiditySweep) {
                score += 25;
                reasons.push("Liquidity swept below low → stop hunt");
            }
            if (ob_level && Math.abs(currentPrice - ob_level) / currentPrice < 0.002) {
                score += 20;
                reasons.push("Price at bullish Order Block");
            }
            if (fvg_level && currentPrice >= fvg_level * 0.999) {
                score += 15;
                reasons.push("Fair Value Gap acting as support");
            }
        } else if (mss === "BEARISH") {
            score -= 30;
            reasons.push("Bearish MSS");
            if (liquiditySweep && currentPrice < liquiditySweep) {
                score -= 25;
                reasons.push("Liquidity swept above high");
            }
            if (ob_level && Math.abs(currentPrice - ob_level) / currentPrice < 0.002) {
                score -= 20;
                reasons.push("Price at bearish Order Block");
            }
            if (fvg_level && currentPrice <= fvg_level * 1.001) {
                score -= 15;
                reasons.push("FVG acting as resistance");
            }
        }
        return { score, reasons, action: score >= 40 ? "BUY" : (score <= -40 ? "SELL" : null) };
    }

    // ---------- Strategy 2: Supply & Demand (Fresh Zones) ----------
    static evaluateSD(data) {
        let score = 0;
        let reasons = [];
        const { supplyZone, demandZone, currentPrice, liquiditySweep } = data;

        if (demandZone && currentPrice >= demandZone.low && currentPrice <= demandZone.high) {
            score += 35;
            reasons.push(`Fresh demand zone [${demandZone.low} - ${demandZone.high}]`);
            if (liquiditySweep && liquiditySweep < demandZone.low) {
                score += 20;
                reasons.push("Liquidity swept below demand → premium reaction");
            }
        }
        if (supplyZone && currentPrice >= supplyZone.low && currentPrice <= supplyZone.high) {
            score -= 35;
            reasons.push(`Fresh supply zone [${supplyZone.low} - ${supplyZone.high}]`);
            if (liquiditySweep && liquiditySweep > supplyZone.high) {
                score -= 20;
                reasons.push("Liquidity swept above supply");
            }
        }
        return { score, reasons, action: score >= 40 ? "BUY" : (score <= -40 ? "SELL" : null) };
    }

    // ---------- Strategy 3: Support & Resistance (Classic) ----------
    static evaluateSR(data) {
        let score = 0;
        let reasons = [];
        const { support, resistance, currentPrice, bounceConfirm } = data;

        if (support && Math.abs(currentPrice - support) / currentPrice < 0.002) {
            score += 25;
            reasons.push(`Strong support at ${support}`);
            if (bounceConfirm === true) {
                score += 15;
                reasons.push("Confirmed bullish rejection (wick/bullish candle)");
            }
        }
        if (resistance && Math.abs(currentPrice - resistance) / currentPrice < 0.002) {
            score -= 25;
            reasons.push(`Strong resistance at ${resistance}`);
            if (bounceConfirm === false) {
                score -= 15;
                reasons.push("Confirmed bearish rejection");
            }
        }
        return { score, reasons, action: score >= 30 ? "BUY" : (score <= -30 ? "SELL" : null) };
    }

    // ---------- Strategy 4: Break of Structure (BOS) + Retest ----------
    static evaluateBOS(data) {
        let score = 0;
        let reasons = [];
        const { bosType, retestZone, currentPrice } = data;

        if (bosType === "BULLISH" && retestZone) {
            if (currentPrice >= retestZone.low && currentPrice <= retestZone.high) {
                score += 35;
                reasons.push(`Bullish BOS retesting broken resistance as support [${retestZone.low} - ${retestZone.high}]`);
            }
        } else if (bosType === "BEARISH" && retestZone) {
            if (currentPrice >= retestZone.low && currentPrice <= retestZone.high) {
                score -= 35;
                reasons.push(`Bearish BOS retesting broken support as resistance`);
            }
        }
        return { score, reasons, action: score >= 35 ? "BUY" : (score <= -35 ? "SELL" : null) };
    }

    // ---------- Strategy 5: Fibonacci Retracement (38.2%, 50%, 61.8%) ----------
    static evaluateFibRetracement(data) {
        let score = 0;
        let reasons = [];
        const { fibLevel, currentPrice, trendDirection } = data; // trendDirection = "UP" or "DOWN"

        if (fibLevel && trendDirection === "UP" && Math.abs(currentPrice - fibLevel) / currentPrice < 0.002) {
            score += 20;
            reasons.push(`Price at ${fibLevel} Fibonacci retracement in uptrend`);
        } else if (fibLevel && trendDirection === "DOWN" && Math.abs(currentPrice - fibLevel) / currentPrice < 0.002) {
            score -= 20;
            reasons.push(`Price at ${fibLevel} Fib retracement in downtrend`);
        }
        return { score, reasons, action: score >= 20 ? "BUY" : (score <= -20 ? "SELL" : null) };
    }

    // ---------- Strategy 6: Spread Filter (Prevents High Spread Trades) ----------
    static checkSpread(data) {
        const { spread, currentPrice } = data;
        if (!spread) return { passed: true, penalty: 0 };
        const spreadPercent = (spread / currentPrice) * 100;
        if (spreadPercent > 0.05) {
            return { passed: false, penalty: -30, reason: `Spread too high (${spreadPercent.toFixed(2)}%)` };
        }
        if (spreadPercent > 0.03) {
            return { passed: true, penalty: -10, reason: `Wide spread (${spreadPercent.toFixed(2)}%) – reduce confidence` };
        }
        return { passed: true, penalty: 0, reason: "Spread acceptable" };
    }

    // ---------- Main Aggregator: runs all strategies and builds final setup ----------
    static getBestSetup(data) {
        // 1. Run all strategy evaluations
        const smc = this.evaluateSMC(data);
        const sd = this.evaluateSD(data);
        const sr = this.evaluateSR(data);
        const bos = this.evaluateBOS(data);
        const fib = this.evaluateFibRetracement(data);
        const spreadCheck = this.checkSpread(data);

        const allResults = [smc, sd, sr, bos, fib];
        let totalScore = 0;
        let allReasons = [];
        let actionVotes = { BUY: 0, SELL: 0, WAIT: 0 };

        for (let res of allResults) {
            totalScore += res.score;
            allReasons.push(...res.reasons);
            if (res.action === "BUY") actionVotes.BUY++;
            else if (res.action === "SELL") actionVotes.SELL++;
            else actionVotes.WAIT++;
        }

        // Apply spread penalty
        totalScore += spreadCheck.penalty;
        if (!spreadCheck.passed) {
            allReasons.unshift(spreadCheck.reason);
        }

        // DXY filter (override if extreme)
        if (data.dxyTrend === "BULLISH" && totalScore > 0) totalScore *= 0.7;
        if (data.dxyTrend === "BEARISH" && totalScore < 0) totalScore *= 0.7;

        // Final action
        let finalAction = "WAIT";
        let confidence = Math.abs(totalScore);
        if (totalScore >= 55) finalAction = "BUY";
        else if (totalScore <= -55) finalAction = "SELL";

        // Grade based on confidence & vote unanimity
        let grade = "B";
        if (confidence >= 75 && (actionVotes.BUY >= 3 || actionVotes.SELL >= 3)) grade = "A+";
        else if (confidence >= 65) grade = "A";
        else if (confidence >= 50) grade = "B+";

        // Build POI, SL, TP using the strongest confluent level
        let poi = null, sl = null, tp = null;
        if (finalAction === "BUY") {
            poi = data.demandZone?.high || data.support || data.ob_level || data.fvg_level || data.currentPrice;
            sl = poi * 0.997;   // 0.3% below POI
            tp = poi * 1.012;   // 1.2% target
        } else if (finalAction === "SELL") {
            poi = data.supplyZone?.low || data.resistance || data.ob_level || data.fvg_level || data.currentPrice;
            sl = poi * 1.003;
            tp = poi * 0.988;
        } else {
            poi = data.poi || data.currentPrice;
        }

        // Calculate RSI from recent closes
        const rsi = this.calcRSI(data.recentCloses);

        return {
            action: finalAction,
            confidence: Math.min(confidence, 100),
            grade,
            poi: poi ? poi.toFixed(5) : "N/A",
            sl: sl ? sl.toFixed(5) : "N/A",
            tp: tp ? tp.toFixed(5) : "N/A",
            reasons: allReasons.slice(0, 5), // top 5 reasons
            rsi: rsi.toFixed(1)
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') window.StrategyEngine = StrategyEngine;
if (typeof module !== 'undefined') module.exports = StrategyEngine;
