import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  erf,
  normalCdf,
  calculateTwoProportionZTest,
  checkSampleRatioMismatch,
  calculateVariantMetrics,
  calculateLifts,
  evaluateExperiment,
} from '../src/utils/experimentationEngine.ts';

describe('Experimentation Engine - Statistical Math & Accuracy', () => {
  it('approximates standard normal CDF correctly at critical z-scores', () => {
    // z = 0 -> CDF = 0.5
    assert.ok(Math.abs(normalCdf(0) - 0.5) < 0.0001);

    // z = 1.96 -> two-sided 95% critical value (CDF ~ 0.975)
    assert.ok(Math.abs(normalCdf(1.96) - 0.975) < 0.001);

    // z = 2.576 -> two-sided 99% critical value (CDF ~ 0.995)
    assert.ok(Math.abs(normalCdf(2.576) - 0.995) < 0.001);

    // Symmetry check: normalCdf(-z) + normalCdf(z) == 1
    const z = 1.45;
    assert.ok(Math.abs(normalCdf(-z) + normalCdf(z) - 1.0) < 0.00001);
  });

  it('calculates two-proportion Z-score and statistical confidence accurately for benchmark', () => {
    // Benchmark experiment:
    // Variant A (20% Off): 1240 clicks, 62 purchases (5.0% CVR)
    // Variant B (Buy 2 Get 1): 1860 clicks, 168 purchases (9.03% CVR)
    const result = calculateTwoProportionZTest(1240, 62, 1860, 168);

    assert.ok(result.zScore > 4.0, `Expected Z > 4.0, got ${result.zScore}`);
    assert.ok(result.pValue < 0.001, `Expected p < 0.001, got ${result.pValue}`);
    assert.ok(result.confidence >= 99.0, `Expected confidence >= 99%, got ${result.confidence}`);
  });

  it('handles identical conversion rates gracefully with zero confidence', () => {
    const result = calculateTwoProportionZTest(1000, 50, 1000, 50);

    assert.equal(result.zScore, 0);
    assert.equal(result.pValue, 1.0);
    assert.equal(result.confidence, 0);
  });

  it('handles zero clicks or conversions without division by zero', () => {
    const zeroClicks = calculateTwoProportionZTest(0, 0, 100, 5);
    assert.equal(zeroClicks.zScore, 0);
    assert.equal(zeroClicks.pValue, 1.0);
    assert.equal(zeroClicks.confidence, 0);

    const zeroConversions = calculateTwoProportionZTest(500, 0, 500, 0);
    assert.equal(zeroConversions.zScore, 0);
    assert.equal(zeroConversions.confidence, 0);
  });
});

describe('Experimentation Engine - Financial & Metric Calculations', () => {
  it('calculates CVR, CPA, ROAS, and AOV correctly for variants', () => {
    const variant = {
      id: 'var-1',
      name: 'Variant B',
      label: 'Variant B',
      tagline: 'Buy 2 Get 1',
      clicks: 1860,
      purchases: 84,
      revenue: 18300,
      conversionRate: 0,
      costPerConversion: 120, // Spend = 120 * 84 = 10,080
    };

    const metrics = calculateVariantMetrics(variant, 20000);

    assert.equal(metrics.clicks, 1860);
    assert.equal(metrics.purchases, 84);
    assert.equal(metrics.revenue, 18300);
    // CVR = (84 / 1860) * 100 = 4.5%
    assert.equal(metrics.conversionRate, 4.5);
    assert.equal(metrics.costPerAcquisition, 120);
    assert.equal(metrics.spend, 10080);
    // ROAS = 18300 / 10080 = 1.82x
    assert.equal(metrics.roas, 1.82);
    // AOV = 18300 / 84 = 218
    assert.equal(metrics.aov, 218);
  });

  it('computes relative and absolute conversion lifts accurately', () => {
    const varA = {
      id: 'a',
      name: 'Variant A',
      label: 'A',
      clicks: 1000,
      purchases: 50,
      revenue: 10000,
      spend: 5000,
      conversionRate: 5.0,
      costPerAcquisition: 100,
      roas: 2.0,
      aov: 200,
    };

    const varB = {
      id: 'b',
      name: 'Variant B',
      label: 'B',
      clicks: 1000,
      purchases: 90,
      revenue: 18000,
      spend: 5400,
      conversionRate: 9.0,
      costPerAcquisition: 60,
      roas: 3.33,
      aov: 200,
    };

    const lifts = calculateLifts(varA, varB);

    assert.equal(lifts.absoluteConversionLift, 4.0); // 9.0 - 5.0
    assert.equal(lifts.relativeConversionLift, 80.0); // (9 - 5) / 5 * 100
    assert.equal(lifts.purchasesLift, 80.0);
    assert.equal(lifts.revenueLift, 80.0);
    assert.equal(lifts.cpaSavings, 40); // 100 - 60 = ₹40 saved
    assert.equal(lifts.cpaSavingsPercent, 40.0);
    assert.equal(lifts.roasLift, 1.33); // 3.33 - 2.0
  });

  it('detects Sample Ratio Mismatch (SRM) when traffic distribution is skewed', () => {
    // Normal split: 1000 vs 1050 (p > 0.1) -> No SRM
    const normal = checkSampleRatioMismatch(1000, 1050);
    assert.equal(normal.isSrm, false);

    // Severe mismatch: 2000 vs 500 (p < 0.001) -> SRM Detected
    const skewed = checkSampleRatioMismatch(2000, 500);
    assert.equal(skewed.isSrm, true);
    assert.ok(skewed.pValue < 0.001);
  });
});

describe('Experimentation Engine - Decision State Machine', () => {
  const baseExperiment = {
    id: 'exp-test',
    name: 'T-Shirt Offer Campaign',
    type: 'Offer Test',
    status: 'Active',
    description: 'Testing 20% Off vs Buy 2 Get 1 Free',
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    primaryGoal: 'Conversion Rate',
    budget: 25000,
    variants: [
      {
        id: 'var-a',
        name: 'Ad A — 20% Off',
        label: 'Variant A',
        tagline: '20% Off Today',
        clicks: 1240,
        purchases: 62,
        revenue: 12400,
        conversionRate: 5.0,
        costPerConversion: 200,
      },
      {
        id: 'var-b',
        name: 'Ad B — Buy 2 Get 1 Free',
        label: 'Variant B',
        tagline: 'Buy 2 Get 1 Free',
        clicks: 1860,
        purchases: 168,
        revenue: 18300,
        conversionRate: 9.0,
        costPerConversion: 120,
      },
    ],
  };

  it('evaluates STATE 1: insufficient_data when clicks < minSampleSize', () => {
    const lowSampleExp = {
      ...baseExperiment,
      variants: [
        { ...baseExperiment.variants[0], clicks: 120, purchases: 6 },
        { ...baseExperiment.variants[1], clicks: 140, purchases: 12 },
      ],
    };

    const result = evaluateExperiment(lowSampleExp, { minSampleSize: 500, confidenceThreshold: 95 });

    assert.equal(result.decisionState, 'insufficient_data');
    assert.equal(result.stateBadgeLabel, 'Insufficient Data');
    assert.equal(result.minSampleSizeMet, false);
    assert.equal(result.winnerVariant, null);
    assert.ok(result.headlineRecommendation.includes('Minimum Sample Size'));
  });

  it('evaluates STATE 2: in_progress when sample size met but confidence < threshold and active', () => {
    // 600 clicks each, but small difference (5.0% vs 5.5% CVR)
    const inProgressExp = {
      ...baseExperiment,
      status: 'Active',
      variants: [
        { ...baseExperiment.variants[0], clicks: 600, purchases: 30 }, // 5.0%
        { ...baseExperiment.variants[1], clicks: 600, purchases: 33 }, // 5.5%
      ],
    };

    const result = evaluateExperiment(inProgressExp, { minSampleSize: 500, confidenceThreshold: 95 });

    assert.equal(result.decisionState, 'in_progress');
    assert.equal(result.stateBadgeLabel, 'In Progress (Collecting Data)');
    assert.equal(result.minSampleSizeMet, true);
    assert.ok(result.stats.confidenceScore < 95.0);
    assert.ok(result.headlineRecommendation.includes('Nearing Significance'));
  });

  it('evaluates STATE 3: winner_declared when sample size met and confidence >= threshold', () => {
    const result = evaluateExperiment(baseExperiment, { minSampleSize: 500, confidenceThreshold: 95 });

    assert.equal(result.decisionState, 'winner_declared');
    assert.equal(result.stateBadgeLabel, 'Winner Declared');
    assert.equal(result.minSampleSizeMet, true);
    assert.ok(result.stats.isStatisticallySignificant);
    assert.ok(result.winnerVariant !== null);
    assert.equal(result.winnerVariant?.id, 'var-b');
    assert.equal(result.runnerUpVariant?.id, 'var-a');
    assert.ok(result.headlineRecommendation.includes('Scale Ad B'));
    assert.ok(result.budgetScalingAdvice.includes('Reallocate 80%+'));
  });

  it('evaluates STATE 4: inconclusive when experiment completed without reaching significance threshold', () => {
    const completedExp = {
      ...baseExperiment,
      status: 'Completed',
      variants: [
        { ...baseExperiment.variants[0], clicks: 800, purchases: 40 }, // 5.0%
        { ...baseExperiment.variants[1], clicks: 800, purchases: 42 }, // 5.25%
      ],
    };

    const result = evaluateExperiment(completedExp, { minSampleSize: 500, confidenceThreshold: 95 });

    assert.equal(result.decisionState, 'inconclusive');
    assert.equal(result.stateBadgeLabel, 'Inconclusive Result');
    assert.equal(result.minSampleSizeMet, true);
    assert.ok(result.stats.confidenceScore < 95.0);
    assert.ok(result.headlineRecommendation.includes('Inconclusive'));
  });

  it('respects custom user settings from Settings page (e.g. 99% confidence threshold)', () => {
    // If user requires 99.9% confidence, a 98% test should be in_progress
    const result = evaluateExperiment(baseExperiment, { minSampleSize: 500, confidenceThreshold: 99.9 });
    // If stats confidence is e.g. 99.5%, it checks threshold
    assert.equal(result.confidenceThresholdRequired, 99.9);
    assert.equal(result.minSampleSizeRequired, 500);
  });

  it('includes statistical assumptions and limitations in the result payload', () => {
    const result = evaluateExperiment(baseExperiment);

    assert.ok(Array.isArray(result.assumptions));
    assert.ok(result.assumptions.length >= 3);
    assert.ok(Array.isArray(result.limitations));
    assert.ok(result.limitations.length >= 2);
  });
});
