import type { Variant, Experiment, UserSettings } from '../types';

/**
 * Funnel Labs Experimentation & Statistics Engine
 *
 * Provides rigorous A/B test analysis for D2C marketing experiments:
 * - Financial & conversion metrics (CTR, CVR, CPA, ROAS, AOV)
 * - Two-proportion Z-test for conversion rate comparisons
 * - High-precision normal CDF and p-value calculation
 * - Sample Ratio Mismatch (SRM) checks
 * - Multi-state experiment lifecycle evaluation
 * - Automated winner declaration and data-driven recommendations
 */

export type ExperimentDecisionState =
  'insufficient_data' | 'in_progress' | 'inconclusive' | 'winner_declared';

export interface CalculatedVariantMetrics {
  id: string;
  name: string;
  label: string;
  tagline?: string;
  clicks: number;
  purchases: number;
  revenue: number;
  spend: number;
  conversionRate: number; // Percentage e.g. 9.0 = 9.0%
  costPerAcquisition: number; // Currency e.g. 120 (CPA)
  roas: number; // Return on Ad Spend e.g. 2.45x
  aov: number; // Average Order Value e.g. 1850
}

export interface MetricLifts {
  relativeConversionLift: number; // e.g. +80.0%
  absoluteConversionLift: number; // e.g. +4.0 percentage points
  purchasesLift: number; // e.g. +35.5%
  revenueLift: number; // e.g. +47.6%
  cpaSavings: number; // e.g. 80.0 (Variant A CPA - Variant B CPA)
  cpaSavingsPercent: number; // e.g. 40.0%
  roasLift: number; // e.g. +0.85x
}

export interface StatisticalAnalysis {
  zScore: number;
  pValue: number;
  confidenceScore: number; // Percentage e.g. 98.4 = 98.4%
  isStatisticallySignificant: boolean;
  sampleRatioMismatch: boolean; // True if traffic split deviates significantly from 50/50
  srmPValue: number;
}

export interface ExperimentEvaluationResult {
  experimentId: string;
  experimentName: string;
  decisionState: ExperimentDecisionState;
  stateBadgeLabel: string;
  stateDescription: string;

  // Variants and comparison
  variantA: CalculatedVariantMetrics;
  variantB: CalculatedVariantMetrics;
  winnerVariant: CalculatedVariantMetrics | null;
  runnerUpVariant: CalculatedVariantMetrics | null;

  // Key performance lifts (Variant B vs Variant A, or Winner vs Runner-up)
  lifts: MetricLifts;

  // Rigorous statistics
  stats: StatisticalAnalysis;

  // Thresholds used
  minSampleSizeRequired: number;
  confidenceThresholdRequired: number;
  sampleSizeProgressPercent: number;
  minSampleSizeMet: boolean;

  // Automated actionable insights
  headlineRecommendation: string;
  actionableSummary: string;
  budgetScalingAdvice: string;

  // Assumptions & Statistical Limitations
  assumptions: string[];
  limitations: string[];
}

/**
 * Standard Normal Error Function (erf) approximation
 * Maximum error < 1.5e-7 (Abramowitz and Stegun 7.1.26)
 */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Standard Normal Cumulative Distribution Function Phi(z)
 */
export function normalCdf(z: number): number {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

/**
 * Compute Two-Proportion Z-Test for comparing conversion rates
 *
 * H0: pA = pB
 * H1: pA != pB (two-sided)
 */
export function calculateTwoProportionZTest(
  clicksA: number,
  purchasesA: number,
  clicksB: number,
  purchasesB: number
): { zScore: number; pValue: number; confidence: number } {
  if (clicksA <= 0 || clicksB <= 0) {
    return { zScore: 0, pValue: 1.0, confidence: 0 };
  }

  const pA = purchasesA / clicksA;
  const pB = purchasesB / clicksB;

  // Pooled conversion rate
  const pooledP = (purchasesA + purchasesB) / (clicksA + clicksB);

  // If pooled conversion rate is 0 or 1, standard error is zero
  if (pooledP <= 0 || pooledP >= 1) {
    return { zScore: 0, pValue: 1.0, confidence: 0 };
  }

  // Standard Error of difference between two proportions
  const se = Math.sqrt(pooledP * (1.0 - pooledP) * (1.0 / clicksA + 1.0 / clicksB));

  if (se === 0) {
    return { zScore: 0, pValue: 1.0, confidence: 0 };
  }

  const zScore = (pB - pA) / se;

  // Two-sided p-value: 2 * (1 - Phi(|z|))
  const pValueRaw = 2.0 * (1.0 - normalCdf(Math.abs(zScore)));
  const pValue = Math.min(1.0, Math.max(0.0001, pValueRaw));

  // Statistical Confidence = (1 - pValue) * 100%
  const confidenceRaw = (1.0 - pValue) * 100.0;
  const confidence = Math.min(99.9, Math.max(0.0, Math.round(confidenceRaw * 10) / 10));

  return {
    zScore: Math.round(zScore * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    confidence,
  };
}

/**
 * Sample Ratio Mismatch (SRM) Check using Chi-Square Goodness of Fit (Expected 50:50)
 */
export function checkSampleRatioMismatch(
  clicksA: number,
  clicksB: number
): { isSrm: boolean; pValue: number } {
  const total = clicksA + clicksB;
  if (total < 100) {
    return { isSrm: false, pValue: 1.0 };
  }

  const expected = total / 2;
  const chiSquare =
    Math.pow(clicksA - expected, 2) / expected + Math.pow(clicksB - expected, 2) / expected;

  // For 1 degree of freedom: p-value = 2 * (1 - Phi(sqrt(chiSquare)))
  const pValue = 2.0 * (1.0 - normalCdf(Math.sqrt(chiSquare)));
  // Typically SRM threshold is p < 0.001
  return {
    isSrm: pValue < 0.001,
    pValue: Math.round(pValue * 10000) / 10000,
  };
}

/**
 * Calculate derived metrics for an individual variant
 */
export function calculateVariantMetrics(
  variant: Variant,
  totalBudget = 0
): CalculatedVariantMetrics {
  const clicks = Math.max(0, variant.clicks || 0);
  const purchases = Math.max(0, variant.purchases || 0);
  const revenue = Math.max(0, variant.revenue || 0);

  // Spend estimate: if totalBudget given, split evenly or estimate via CPA * purchases
  const spend =
    variant.costPerConversion && purchases > 0
      ? variant.costPerConversion * purchases
      : totalBudget > 0
        ? totalBudget / 2
        : purchases * 150;

  const conversionRate = clicks > 0 ? (purchases / clicks) * 100 : 0;
  const costPerAcquisition = purchases > 0 ? spend / purchases : spend;
  const roas = spend > 0 ? revenue / spend : 0;
  const aov = purchases > 0 ? revenue / purchases : 0;

  return {
    id: variant.id,
    name: variant.name,
    label: variant.label,
    tagline: variant.tagline,
    clicks,
    purchases,
    revenue,
    spend: Math.round(spend),
    conversionRate: Math.round(conversionRate * 10) / 10,
    costPerAcquisition: Math.round(costPerAcquisition),
    roas: Math.round(roas * 100) / 100,
    aov: Math.round(aov),
  };
}

/**
 * Compute comparative lifts between two variants (Variant B vs Variant A)
 */
export function calculateLifts(
  variantA: CalculatedVariantMetrics,
  variantB: CalculatedVariantMetrics
): MetricLifts {
  const pA = variantA.conversionRate;
  const pB = variantB.conversionRate;

  const absoluteConversionLift = Math.round((pB - pA) * 10) / 10;
  const relativeConversionLift =
    pA > 0 ? Math.round(((pB - pA) / pA) * 1000) / 10 : pB > 0 ? 100 : 0;

  const purchasesLift =
    variantA.purchases > 0
      ? Math.round(((variantB.purchases - variantA.purchases) / variantA.purchases) * 1000) / 10
      : 0;

  const revenueLift =
    variantA.revenue > 0
      ? Math.round(((variantB.revenue - variantA.revenue) / variantA.revenue) * 1000) / 10
      : 0;

  const cpaSavings = Math.round(variantA.costPerAcquisition - variantB.costPerAcquisition);
  const cpaSavingsPercent =
    variantA.costPerAcquisition > 0
      ? Math.round((cpaSavings / variantA.costPerAcquisition) * 1000) / 10
      : 0;

  const roasLift = Math.round((variantB.roas - variantA.roas) * 100) / 100;

  return {
    relativeConversionLift,
    absoluteConversionLift,
    purchasesLift,
    revenueLift,
    cpaSavings,
    cpaSavingsPercent,
    roasLift,
  };
}

/**
 * Main Evaluation Engine: Analyzes an Experiment against Configured Settings
 */
export function evaluateExperiment(
  experiment: Experiment,
  settings?: Partial<UserSettings>
): ExperimentEvaluationResult {
  const minSampleSize = settings?.minSampleSize ?? 500;
  const confidenceThreshold = settings?.confidenceThreshold ?? 95.0;

  const varA = experiment.variants[0] || {
    id: 'var-a',
    name: 'Variant A',
    label: 'Variant A',
    clicks: 0,
    purchases: 0,
    revenue: 0,
    conversionRate: 0,
    costPerConversion: 0,
  };

  const varB = experiment.variants[1] || {
    id: 'var-b',
    name: 'Variant B',
    label: 'Variant B',
    clicks: 0,
    purchases: 0,
    revenue: 0,
    conversionRate: 0,
    costPerConversion: 0,
  };

  const metricsA = calculateVariantMetrics(varA, experiment.budget);
  const metricsB = calculateVariantMetrics(varB, experiment.budget);

  // Statistics
  const zTest = calculateTwoProportionZTest(
    metricsA.clicks,
    metricsA.purchases,
    metricsB.clicks,
    metricsB.purchases
  );

  const srm = checkSampleRatioMismatch(metricsA.clicks, metricsB.clicks);

  const lifts = calculateLifts(metricsA, metricsB);

  // Determine Sample Size Sufficiency
  const minObservedClicks = Math.min(metricsA.clicks, metricsB.clicks);
  const minSampleSizeMet = minObservedClicks >= minSampleSize;
  const sampleSizeProgressPercent = Math.min(
    100,
    Math.round((minObservedClicks / minSampleSize) * 100)
  );

  const isStatisticallySignificant = zTest.confidence >= confidenceThreshold;

  // Determine Lifecycle Decision State
  let decisionState: ExperimentDecisionState;
  let stateBadgeLabel: string;
  let stateDescription: string;
  let winnerVariant: CalculatedVariantMetrics | null = null;
  let runnerUpVariant: CalculatedVariantMetrics | null = null;

  if (!minSampleSizeMet) {
    decisionState = 'insufficient_data';
    stateBadgeLabel = 'Insufficient Data';
    stateDescription = `Variant traffic (${minObservedClicks.toLocaleString()} visitors) is below your minimum threshold of ${minSampleSize.toLocaleString()} sample size. Collect more data before drawing conclusions.`;
  } else if (isStatisticallySignificant) {
    if (metricsB.conversionRate > metricsA.conversionRate) {
      decisionState = 'winner_declared';
      stateBadgeLabel = 'Winner Declared';
      winnerVariant = metricsB;
      runnerUpVariant = metricsA;
      stateDescription = `${metricsB.name} decisively outperforms ${metricsA.name} with ${lifts.relativeConversionLift > 0 ? '+' : ''}${lifts.relativeConversionLift}% conversion rate lift at ${zTest.confidence}% statistical confidence.`;
    } else if (metricsA.conversionRate > metricsB.conversionRate) {
      decisionState = 'winner_declared';
      stateBadgeLabel = 'Winner Declared';
      winnerVariant = metricsA;
      runnerUpVariant = metricsB;
      stateDescription = `${metricsA.name} decisively outperforms ${metricsB.name} with higher conversion rate at ${zTest.confidence}% statistical confidence.`;
    } else {
      decisionState = 'inconclusive';
      stateBadgeLabel = 'Inconclusive Result';
      stateDescription =
        'Both variants produced identical conversion rates with no distinguishable winner.';
    }
  } else {
    // Sample size met, but confidence below threshold
    if (experiment.status === 'Completed') {
      decisionState = 'inconclusive';
      stateBadgeLabel = 'Inconclusive Result';
      stateDescription = `Experiment finished with sufficient sample size (${minObservedClicks.toLocaleString()} visitors), but only reached ${zTest.confidence}% confidence (below your ${confidenceThreshold}% threshold). No statistically significant difference was detected.`;
    } else {
      decisionState = 'in_progress';
      stateBadgeLabel = 'In Progress (Collecting Data)';
      stateDescription = `Minimum sample size reached (${minObservedClicks.toLocaleString()} visitors), but statistical confidence (${zTest.confidence}%) has not yet cleared your ${confidenceThreshold}% threshold. Continue testing.`;
    }
  }

  // Generate Actionable Recommendations
  let headlineRecommendation = '';
  let actionableSummary = '';
  let budgetScalingAdvice = '';

  if (decisionState === 'winner_declared' && winnerVariant && runnerUpVariant) {
    headlineRecommendation = `Scale ${winnerVariant.name}: ${lifts.relativeConversionLift > 0 ? '+' : ''}${lifts.relativeConversionLift}% CVR Lift`;
    actionableSummary = `${winnerVariant.name} produced ${winnerVariant.purchases} purchases at ${winnerVariant.conversionRate}% CVR vs ${runnerUpVariant.conversionRate}% for ${runnerUpVariant.name}. Reallocating ad spend will maximize conversion volume while reducing CPA by ₹${Math.abs(lifts.cpaSavings)}.`;
    budgetScalingAdvice = `Reallocate 80%+ of ${experiment.connectedCampaign || 'campaign'} budget directly to ${winnerVariant.name}. Pause losing variant to eliminate budget waste.`;
  } else if (decisionState === 'insufficient_data') {
    headlineRecommendation = 'Continue Test to Reach Minimum Sample Size';
    actionableSummary = `Experiment has logged ${minObservedClicks} clicks per variant. Need ${minSampleSize - minObservedClicks} more clicks to satisfy your minimum sample size threshold (${minSampleSize}).`;
    budgetScalingAdvice =
      'Maintain an even 50/50 budget split between variants until minimum sample size is attained.';
  } else if (decisionState === 'in_progress') {
    headlineRecommendation = 'Test Nearing Significance — Do Not Stop Early';
    actionableSummary = `Current confidence is ${zTest.confidence}% (target: ${confidenceThreshold}%). Stopping early risks false positive errors (peeking bias).`;
    budgetScalingAdvice =
      'Keep equal traffic distribution until statistical confidence crosses the threshold.';
  } else {
    headlineRecommendation = 'Inconclusive Test — Pivot Offer or Creative Strategy';
    actionableSummary = `No meaningful performance difference detected between ${metricsA.name} and ${metricsB.name} (p-value = ${zTest.pValue}). Neither variant significantly outperforms the other.`;
    budgetScalingAdvice =
      'Retire both variations or design a more distinct offer difference (e.g. testing free shipping vs bundle discount).';
  }

  // Explicit Assumptions & Limitations
  const assumptions = [
    'Independent Observations: Each visitor click is treated as an independent random trial without repeated cross-device contamination.',
    'Stationarity: Marketing traffic source quality and ad spend delivery remained stable throughout the test duration.',
    'Uniform Random Allocation: Traffic split was distributed evenly (50/50) across both variations.',
  ];

  const limitations = [
    'Attribution Window: Calculations reflect same-session and short-window purchases; delayed post-view conversions are not factored in.',
    'External Seasonality: Holidays, promotional calendar events, or ad platform algorithmic swings may influence relative performance.',
    srm.isSrm
      ? 'Sample Ratio Mismatch Detected: Unequal traffic distribution observed (p < 0.001). Check URL redirect or tracking pixel implementation.'
      : 'Sample Ratio Verification: Traffic distribution passed goodness-of-fit checks with no Sample Ratio Mismatch (SRM).',
  ];

  return {
    experimentId: experiment.id,
    experimentName: experiment.name,
    decisionState,
    stateBadgeLabel,
    stateDescription,
    variantA: metricsA,
    variantB: metricsB,
    winnerVariant,
    runnerUpVariant,
    lifts,
    stats: {
      zScore: zTest.zScore,
      pValue: zTest.pValue,
      confidenceScore: zTest.confidence,
      isStatisticallySignificant,
      sampleRatioMismatch: srm.isSrm,
      srmPValue: srm.pValue,
    },
    minSampleSizeRequired: minSampleSize,
    confidenceThresholdRequired: confidenceThreshold,
    sampleSizeProgressPercent,
    minSampleSizeMet,
    headlineRecommendation,
    actionableSummary,
    budgetScalingAdvice,
    assumptions,
    limitations,
  };
}
