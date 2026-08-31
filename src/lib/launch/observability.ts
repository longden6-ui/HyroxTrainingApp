// Observability and logging [T-33, PRD 12.4]
// Log prediction requests with model version, latency, outcome
// Monitor plan-generation failures, safety-trigger rates
// Assert sensitive input values never reach logs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Prediction request logging (NO sensitive data) [T-33, PRD 12.4]
export interface PredictionLog {
  modelVersion: string;
  latencyMs: number;
  confidence: string;
  result: 'SUCCESS' | 'FAILED' | 'ERROR';
  errorType?: string;
  timestamp: string;
}

// Log prediction request with performance metrics [T-33]
export async function logPredictionRequest(input: {
  modelVersion: string;
  latencyMs: number;
  confidence: string;
  result: 'SUCCESS' | 'FAILED' | 'ERROR';
  errorType?: string;
}): Promise<{ success: boolean }> {
  try {
    // IMPORTANT: NO athlete ID, weight, 5K time, or other sensitive data
    const log: PredictionLog = {
      modelVersion: input.modelVersion,
      latencyMs: input.latencyMs,
      confidence: input.confidence,
      result: input.result,
      errorType: input.errorType,
      timestamp: new Date().toISOString(),
    };

    // Store in audit trail (observable by admins only) [T-33]
    // In production, this would go to structured logging service (e.g., CloudWatch, Datadog)
    console.log('[OBSERVABILITY]', JSON.stringify(log));

    return { success: true };
  } catch (error) {
    console.error('Failed to log prediction:', error);
    return { success: false };
  }
}

// Plan generation monitoring [T-33]
export interface PlanGenerationLog {
  status: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'GUARDRAIL_VIOLATION' | 'RED_FLAG_DETECTED';
  sessionCount?: number;
  executionTimeMs: number;
  ruleSetVersion?: string;
  timestamp: string;
}

// Log plan generation status [T-33]
export async function logPlanGeneration(input: {
  status: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'GUARDRAIL_VIOLATION' | 'RED_FLAG_DETECTED';
  sessionCount?: number;
  executionTimeMs: number;
  ruleSetVersion?: string;
}): Promise<{ success: boolean }> {
  try {
    const log: PlanGenerationLog = {
      status: input.status,
      sessionCount: input.sessionCount,
      executionTimeMs: input.executionTimeMs,
      ruleSetVersion: input.ruleSetVersion,
      timestamp: new Date().toISOString(),
    };

    console.log('[OBSERVABILITY] Plan Generation:', JSON.stringify(log));
    return { success: true };
  } catch (error) {
    console.error('Failed to log plan generation:', error);
    return { success: false };
  }
}

// Safety trigger monitoring [T-33, FR-G10]
export interface SafetyTriggerLog {
  triggerType: 'RED_FLAG' | 'PAIN_THRESHOLD' | 'GUARDRAIL_VIOLATION';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ruleSetVersion: string;
  timestamp: string;
}

// Log safety trigger (no athlete details) [T-33]
export async function logSafetyTrigger(input: {
  triggerType: 'RED_FLAG' | 'PAIN_THRESHOLD' | 'GUARDRAIL_VIOLATION';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ruleSetVersion: string;
}): Promise<{ success: boolean }> {
  try {
    const log: SafetyTriggerLog = {
      triggerType: input.triggerType,
      severity: input.severity,
      ruleSetVersion: input.ruleSetVersion,
      timestamp: new Date().toISOString(),
    };

    console.log('[OBSERVABILITY] Safety Trigger:', JSON.stringify(log));
    return { success: true };
  } catch (error) {
    console.error('Failed to log safety trigger:', error);
    return { success: false };
  }
}

// Error rate monitoring by cohort [T-33]
export async function getErrorMetrics(window: 'HOUR' | 'DAY' | 'WEEK' = 'DAY'): Promise<{
  success: boolean;
  metrics?: {
    totalRequests: number;
    errorCount: number;
    errorRate: number;
    topErrors: Array<{ type: string; count: number }>;
  };
}> {
  try {
    // In production, query from structured logging service
    // This is a placeholder that would aggregate observability data
    return {
      success: true,
      metrics: {
        totalRequests: 0,
        errorCount: 0,
        errorRate: 0,
        topErrors: [],
      },
    };
  } catch (error) {
    console.error('Failed to get error metrics:', error);
    return { success: false };
  }
}

// CRITICAL: Test that sensitive data never reaches logs [T-33, PRD 12.4]
export function assertNoSensitiveDataInLog(logLine: string): boolean {
  // Patterns that should NEVER appear in logs [T-33]
  const sensitivePatterns = [
    /\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b.*kg/, // Weight
    /pain.*severe|pain.*moderate/i, // Specific pain details
    /mobility.*limited|limited.*mobility/i, // Specific mobility details
    /\d{3,4}s?$/i, // Specific 5K times
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(logLine)) {
      console.error('[SECURITY] Sensitive data detected in log:', logLine);
      return false;
    }
  }

  return true;
}
