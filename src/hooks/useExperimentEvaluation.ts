import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Experiment } from '../types';
import { evaluateExperiment, ExperimentEvaluationResult } from '../utils/experimentationEngine';

/**
 * Custom React Hook to evaluate an Experiment using current UserSettings
 */
export function useExperimentEvaluation(
  experiment: Experiment | null | undefined
): ExperimentEvaluationResult | null {
  const { userSettings } = useApp();

  return useMemo(() => {
    if (!experiment) return null;
    return evaluateExperiment(experiment, userSettings);
  }, [experiment, userSettings]);
}
