import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateStoreName,
  evaluatePasswordStrength,
  validateExperimentForm,
  validateSettingsForm,
  validateShopifyDomain,
  validateMetaAccountId,
} from '../../src/utils/validators.ts';

describe('Unit Tests: Validation Utilities', () => {
  describe('Email Validation', () => {
    it('approves standard RFC compliant email addresses', () => {
      assert.equal(validateEmail('founder@brand.com'), null);
      assert.equal(validateEmail('growth.team+tests@d2c-store.in'), null);
      assert.equal(validateEmail('aarav@subdomain.store.co'), null);
    });

    it('rejects invalid or empty email addresses with helpful feedback', () => {
      assert.ok(validateEmail(''));
      assert.ok(validateEmail('plainaddress'));
      assert.ok(validateEmail('missing-at-domain.com'));
      assert.ok(validateEmail('missing-domain@.com'));
      assert.ok(validateEmail('spaces in@email.com'));
    });
  });

  describe('Password & Strength Evaluation', () => {
    it('evaluates password strength across complexity tiers', () => {
      const veryWeak = evaluatePasswordStrength('abc');
      assert.equal(veryWeak.score, 0);

      const weak = evaluatePasswordStrength('abcdefgh');
      assert.equal(weak.score, 1);

      const moderate = evaluatePasswordStrength('Abcdefgh1');
      assert.equal(moderate.score, 3);

      const strong = evaluatePasswordStrength('Abcdefgh1@!');
      assert.equal(strong.score, 4);
      assert.equal(strong.label, 'Very Strong');
    });

    it('validates minimum password length and complexity requirements', () => {
      assert.ok(validatePassword('short', 8));
      assert.ok(validatePassword('alllowercaseno', 8));
      assert.equal(validatePassword('SecurePass123', 8), null);
    });

    it('validates password matching confirmation correctly', () => {
      assert.equal(validatePasswordConfirmation('secret123', 'secret123'), null);
      assert.ok(validatePasswordConfirmation('secret123', 'different123'));
      assert.ok(validatePasswordConfirmation('secret123', ''));
    });
  });

  describe('Store Name Validation', () => {
    it('accepts valid brand store names', () => {
      assert.equal(validateStoreName('Bombay Threads'), null);
      assert.equal(validateStoreName('The D2C Collective'), null);
    });

    it('rejects empty or overly short names', () => {
      assert.ok(validateStoreName(''));
      assert.ok(validateStoreName(' '));
      assert.ok(validateStoreName('A'));
    });
  });

  describe('Experiment Form Validation', () => {
    const validForm = {
      name: 'Diwali 20% vs Free Shipping Test',
      type: 'Offer Test',
      budget: 25000,
      startDate: '2026-10-10',
      endDate: '2026-10-24',
      variantAName: 'Variant A — 20% Off',
      variantATagline: 'Flat 20% Off Everything',
      variantBName: 'Variant B — Free Shipping',
      variantBTagline: 'Free Fast Express Shipping',
    };

    it('passes for properly structured experiment inputs', () => {
      const result = validateExperimentForm(validForm);
      assert.equal(result.isValid, true);
      assert.deepEqual(result.errors, {});
    });

    it('detects invalid date orders where end date is before or equal to start date', () => {
      const result = validateExperimentForm({
        ...validForm,
        startDate: '2026-10-24',
        endDate: '2026-10-10',
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.endDate);
    });

    it('detects zero or negative test budgets', () => {
      const result = validateExperimentForm({
        ...validForm,
        budget: -500,
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.budget);
    });

    it('detects duplicate variant names', () => {
      const result = validateExperimentForm({
        ...validForm,
        variantBName: 'Variant A — 20% Off',
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.variantBName);
    });
  });

  describe('Settings Form Validation', () => {
    it('validates sample size and confidence boundaries', () => {
      const validSettings = {
        storeName: 'Bombay Threads',
        currency: 'INR',
        minSampleSize: 200,
        confidenceThreshold: 95.0,
        alertThreshold: 5.0,
        emailAlerts: false,
      };

      const validResult = validateSettingsForm(validSettings);
      assert.equal(validResult.isValid, true);

      // Too low sample size (< 50)
      const invalidSample = validateSettingsForm({
        ...validSettings,
        minSampleSize: 20,
      });
      assert.equal(invalidSample.isValid, false);
      assert.ok(invalidSample.errors.minSampleSize);

      // Out of bounds confidence (> 99.9)
      const invalidConfidence = validateSettingsForm({
        ...validSettings,
        confidenceThreshold: 105,
      });
      assert.equal(invalidConfidence.isValid, false);
      assert.ok(invalidConfidence.errors.confidenceThreshold);
    });
  });

  describe('Integration Provider Validation', () => {
    it('validates Shopify store domain formats', () => {
      assert.equal(validateShopifyDomain('mybrand.myshopify.com'), null);
      assert.equal(validateShopifyDomain('bombay-threads'), null);
      assert.ok(validateShopifyDomain(''));
      assert.ok(validateShopifyDomain('https://invalid url with spaces'));
    });

    it('validates Meta Ad Account ID formats', () => {
      assert.equal(validateMetaAccountId('act_123456789'), null);
      assert.equal(validateMetaAccountId('9876543210'), null);
      assert.ok(validateMetaAccountId(''));
      assert.ok(validateMetaAccountId('invalid_format_abc'));
    });
  });
});
