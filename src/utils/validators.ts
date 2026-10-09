/**
 * Client-Side Form Validation Module for Funnel Labs
 * Provides RFC-compliant email checks, password strength rules,
 * experiment configuration boundaries, and store settings validation.
 */

export interface ValidationResult<T = Record<string, string>> {
  isValid: boolean;
  errors: T;
}

// -----------------------------------------------------------------------------
// Authentication Validation
// -----------------------------------------------------------------------------

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Work email address is required.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid work email address (e.g. founder@brand.com).';
  }
  return null;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  feedback: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('At least one uppercase letter (A-Z)');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('At least one number (0-9)');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('At least one special symbol (@$!%*?&)');

  const labels: PasswordStrength['label'][] = [
    'Very Weak',
    'Weak',
    'Fair',
    'Strong',
    'Very Strong',
  ];

  return {
    score,
    label: labels[score] || 'Very Weak',
    feedback,
  };
}

export function validatePassword(password: string, minLength = 8): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }
  if (!/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
    return 'Password must contain at least one uppercase letter or number.';
  }
  return null;
}

export function validatePasswordConfirmation(password: string, confirm: string): string | null {
  if (!confirm) {
    return 'Please confirm your password.';
  }
  if (password !== confirm) {
    return 'Passwords do not match.';
  }
  return null;
}

export function validateStoreName(storeName: string): string | null {
  const trimmed = storeName.trim();
  if (!trimmed) {
    return 'Brand / Store name is required.';
  }
  if (trimmed.length < 2) {
    return 'Store name must be at least 2 characters long.';
  }
  if (trimmed.length > 80) {
    return 'Store name cannot exceed 80 characters.';
  }
  return null;
}

// -----------------------------------------------------------------------------
// Experiment Form Validation
// -----------------------------------------------------------------------------

export interface ExperimentFormValues {
  name: string;
  type: string;
  description?: string;
  budget: string | number;
  startDate: string;
  endDate: string;
  variantAName: string;
  variantATagline: string;
  variantBName: string;
  variantBTagline: string;
}

export function validateExperimentForm(values: ExperimentFormValues): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.name || !values.name.trim()) {
    errors.name = 'Experiment name is required.';
  } else if (values.name.trim().length < 3) {
    errors.name = 'Experiment name must be at least 3 characters.';
  } else if (values.name.trim().length > 100) {
    errors.name = 'Experiment name cannot exceed 100 characters.';
  }

  const numericBudget = Number(values.budget);
  if (isNaN(numericBudget) || numericBudget <= 0) {
    errors.budget = 'Please enter a valid monthly budget greater than ₹0.';
  } else if (numericBudget > 10000000) {
    errors.budget = 'Budget cannot exceed ₹1,00,00,000 per experiment.';
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  }

  if (!values.endDate) {
    errors.endDate = 'End date is required.';
  }

  if (values.startDate && values.endDate) {
    const start = new Date(values.startDate).getTime();
    const end = new Date(values.endDate).getTime();
    if (isNaN(start) || isNaN(end)) {
      errors.endDate = 'Please provide valid ISO dates (YYYY-MM-DD).';
    } else if (end <= start) {
      errors.endDate = 'End date must be strictly after the start date.';
    }
  }

  if (!values.variantAName || !values.variantAName.trim()) {
    errors.variantAName = 'Variant A name is required.';
  }
  if (!values.variantBName || !values.variantBName.trim()) {
    errors.variantBName = 'Variant B name is required.';
  }

  if (
    values.variantAName &&
    values.variantBName &&
    values.variantAName.trim().toLowerCase() === values.variantBName.trim().toLowerCase()
  ) {
    errors.variantBName = 'Variant B must have a distinct name from Variant A.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// -----------------------------------------------------------------------------
// Settings Form Validation
// -----------------------------------------------------------------------------

export interface SettingsFormValues {
  storeName: string;
  currency: string;
  minSampleSize: number | string;
  confidenceThreshold: number | string;
  alertThreshold: number | string;
  emailAlerts: boolean;
  alertEmail?: string;
}

export function validateSettingsForm(values: SettingsFormValues): ValidationResult {
  const errors: Record<string, string> = {};

  const storeError = validateStoreName(values.storeName);
  if (storeError) errors.storeName = storeError;

  const sampleSize = Number(values.minSampleSize);
  if (isNaN(sampleSize) || sampleSize < 50 || sampleSize > 100000) {
    errors.minSampleSize = 'Minimum sample size must be between 50 and 100,000 visitors.';
  }

  const confidence = Number(values.confidenceThreshold);
  if (isNaN(confidence) || confidence < 80.0 || confidence > 99.9) {
    errors.confidenceThreshold = 'Confidence threshold must be between 80.0% and 99.9%.';
  }

  const alertThresh = Number(values.alertThreshold);
  if (isNaN(alertThresh) || alertThresh < 1.0 || alertThresh > 100.0) {
    errors.alertThreshold = 'Alert threshold must be between 1.0% and 100.0%.';
  }

  if (values.emailAlerts && values.alertEmail) {
    const emailErr = validateEmail(values.alertEmail);
    if (emailErr) errors.alertEmail = emailErr;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// -----------------------------------------------------------------------------
// Integration Credentials Validation
// -----------------------------------------------------------------------------

export function validateShopifyDomain(domain: string): string | null {
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) {
    return 'Shopify store domain is required.';
  }
  // Matches storename.myshopify.com or simple handle
  const myshopifyRegex = /^[a-z0-9][a-z0-9-]*(\.myshopify\.com)?$/;
  if (!myshopifyRegex.test(trimmed)) {
    return 'Must be a valid Shopify domain (e.g. brand-name.myshopify.com or brand-name).';
  }
  return null;
}

export function validateMetaAccountId(accountId: string): string | null {
  const trimmed = accountId.trim();
  if (!trimmed) {
    return 'Meta Ad Account ID is required.';
  }
  // Matches act_123456789 or 123456789
  const metaRegex = /^(act_)?[0-9]{6,20}$/;
  if (!metaRegex.test(trimmed)) {
    return 'Invalid Meta Ad Account ID format. Must be numeric or prefixed with act_ (e.g. act_123456789).';
  }
  return null;
}
