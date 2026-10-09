import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExperiment } from '../../src/utils/experimentationEngine.ts';

describe('Unit Tests: Experiment Creation & Model Initialization', () => {
  function createExperimentPayload(overrides = {}) {
    const id = `exp-${Date.now()}`;
    return {
      id,
      name: overrides.name || 'Summer Offer Test',
      type: overrides.type || 'Offer Test',
      status: overrides.status || 'Active',
      description: overrides.description || 'Test 10% vs 20% discount',
      startDate: overrides.startDate || '2026-10-01',
      endDate: overrides.endDate || '2026-10-15',
      primaryGoal: overrides.primaryGoal || 'Purchases',
      budget: overrides.budget || 20000,
      connectedCampaign: overrides.connectedCampaign || 'Instagram — Flash Sale',
      confidenceScore: 50,
      winnerName: 'Gathering data',
      variants: overrides.variants || [
        {
          id: `var-${id}-a`,
          label: 'Variant A',
          name: overrides.variantAName || 'Control — 10% Off',
          tagline: 'Get 10% off your order',
          clicks: overrides.variantAClicks ?? 300,
          purchases: overrides.variantAPurchases ?? 15,
          revenue: 15000,
          conversionRate: 5.0,
          costPerConversion: 200,
          isWinner: false,
        },
        {
          id: `var-${id}-b`,
          label: 'Variant B',
          name: overrides.variantBName || 'Challenger — 20% Off',
          tagline: 'Get 20% off your order',
          clicks: overrides.variantBClicks ?? 320,
          purchases: overrides.variantBPurchases ?? 24,
          revenue: 24000,
          conversionRate: 7.5,
          costPerConversion: 150,
          isWinner: true,
        },
      ],
    };
  }

  it('constructs an experiment with complete required fields and variant pairing', () => {
    const experiment = createExperimentPayload();
    assert.ok(experiment.id.startsWith('exp-'));
    assert.equal(experiment.variants.length, 2);
    assert.equal(experiment.variants[0].label, 'Variant A');
    assert.equal(experiment.variants[1].label, 'Variant B');
    assert.equal(experiment.status, 'Active');
    assert.equal(experiment.primaryGoal, 'Purchases');
  });

  it('evaluates statistical results directly upon new experiment creation', () => {
    const experiment = createExperimentPayload({
      variantAClicks: 500,
      variantAPurchases: 25, // 5.0%
      variantBClicks: 500,
      variantBPurchases: 45, // 9.0%
    });

    const evaluation = evaluateExperiment(experiment, {
      minSampleSize: 200,
      confidenceThreshold: 95.0,
    });

    assert.equal(evaluation.decisionState, 'winner_declared');
    assert.ok(evaluation.stats.confidenceScore > 95.0);
    assert.equal(evaluation.winnerVariant?.label, 'Variant B');
    assert.ok(evaluation.lifts.relativeConversionLift > 70); // 80% lift
  });
});
