/**
 * Server-Side Validation Module for Funnel Labs API endpoints.
 * Validates JSON payloads, prevents injection/malformed structures,
 * and ensures mathematical sanity before processing.
 */

export interface ServerValidationResult {
  isValid: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export function validateEvaluatePayload(body: any): ServerValidationResult {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }

  const { experiment, settings } = body;
  if (!experiment || typeof experiment !== 'object') {
    return { isValid: false, error: 'Field "experiment" is required and must be an object.' };
  }

  if (!Array.isArray(experiment.variants) || experiment.variants.length < 2) {
    return {
      isValid: false,
      error: 'Field "experiment.variants" must be an array containing at least 2 variants.',
    };
  }

  for (let i = 0; i < experiment.variants.length; i++) {
    const v = experiment.variants[i];
    if (typeof v.clicks !== 'number' || v.clicks < 0) {
      return {
        isValid: false,
        error: `Variant index ${i} (${v.name || 'unnamed'}): "clicks" must be a non-negative number.`,
      };
    }
    if (typeof v.purchases !== 'number' || v.purchases < 0) {
      return {
        isValid: false,
        error: `Variant index ${i} (${v.name || 'unnamed'}): "purchases" must be a non-negative number.`,
      };
    }
    if (v.purchases > v.clicks && v.clicks > 0) {
      return {
        isValid: false,
        error: `Variant index ${i} (${v.name || 'unnamed'}): purchases (${v.purchases}) cannot exceed clicks (${v.clicks}).`,
      };
    }
  }

  if (settings && typeof settings === 'object') {
    if (
      settings.minSampleSize !== undefined &&
      (typeof settings.minSampleSize !== 'number' || settings.minSampleSize < 10)
    ) {
      return { isValid: false, error: 'settings.minSampleSize must be at least 10.' };
    }
    if (
      settings.confidenceThreshold !== undefined &&
      (typeof settings.confidenceThreshold !== 'number' ||
        settings.confidenceThreshold < 50 ||
        settings.confidenceThreshold > 99.99)
    ) {
      return {
        isValid: false,
        error: 'settings.confidenceThreshold must be a percentage between 50 and 99.99.',
      };
    }
  }

  return { isValid: true };
}

export function validateSyncPayload(body: any): ServerValidationResult {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }

  const { provider, organizationId } = body;

  if (!provider || !['shopify', 'meta'].includes(provider)) {
    return {
      isValid: false,
      error: 'Invalid "provider". Allowed providers are "shopify" or "meta".',
    };
  }

  if (!organizationId || typeof organizationId !== 'string' || organizationId.trim().length === 0) {
    return {
      isValid: false,
      error: 'Valid "organizationId" is required.',
    };
  }

  return { isValid: true };
}

export function validateDisconnectPayload(body: any): ServerValidationResult {
  return validateSyncPayload(body);
}

export function validateOAuthInitiateQuery(query: URLSearchParams): ServerValidationResult {
  const provider = query.get('provider');
  const orgId = query.get('orgId');

  if (!provider || !['shopify', 'meta'].includes(provider)) {
    return { isValid: false, error: 'Missing or invalid "provider" parameter ("shopify" or "meta").' };
  }

  if (!orgId || orgId.trim().length === 0) {
    return { isValid: false, error: 'Missing "orgId" parameter.' };
  }

  return { isValid: true };
}
