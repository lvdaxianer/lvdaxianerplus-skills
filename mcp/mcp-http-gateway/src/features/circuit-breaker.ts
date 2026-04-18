/**
 * Circuit breaker implementation
 *
 * @author lvdaxianerplus
 * @date 2026-04-18
 */

import type { CircuitBreakerConfig } from '../config/types.js';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

/**
 * Circuit breaker states per tool
 */
const circuitBreakers: Map<string, CircuitBreakerState> = new Map();

/**
 * Get or create circuit breaker state for a tool
 *
 * @param toolName - Tool name
 * @param config - Circuit breaker configuration
 * @returns Circuit breaker state
 */
function getCircuitBreakerState(toolName: string, config: CircuitBreakerConfig): CircuitBreakerState {
  let state = circuitBreakers.get(toolName);

  if (!state) {
    state = {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };
    circuitBreakers.set(toolName, state);
  }

  return state;
}

/**
 * Check if circuit breaker allows request
 *
 * @param toolName - Tool name
 * @param config - Circuit breaker configuration
 * @returns Circuit state: OPEN means blocked, CLOSED/HALF_OPEN means allowed
 */
export function checkCircuitBreaker(toolName: string, config: CircuitBreakerConfig): CircuitState {
  if (!config.enabled) {
    return 'CLOSED';
  }

  const state = getCircuitBreakerState(toolName, config);

  if (state.state === 'OPEN') {
    // Check if we should transition to HALF_OPEN
    if (Date.now() >= state.nextAttemptTime) {
      state.state = 'HALF_OPEN';
      state.successes = 0;
    }
  }

  return state.state;
}

/**
 * Record a successful request
 *
 * @param toolName - Tool name
 * @param config - Circuit breaker configuration
 */
export function recordSuccess(toolName: string, config: CircuitBreakerConfig): void {
  if (!config.enabled) return;

  const state = getCircuitBreakerState(toolName, config);

  if (state.state === 'HALF_OPEN') {
    state.successes++;
    if (state.successes >= config.successThreshold) {
      // Transition to CLOSED
      state.state = 'CLOSED';
      state.failures = 0;
      state.successes = 0;
    }
  } else if (state.state === 'CLOSED') {
    // Reset failures on success
    state.failures = 0;
  }
}

/**
 * Record a failed request
 *
 * @param toolName - Tool name
 * @param config - Circuit breaker configuration
 */
export function recordFailure(toolName: string, config: CircuitBreakerConfig): void {
  if (!config.enabled) return;

  const state = getCircuitBreakerState(toolName, config);
  state.lastFailureTime = Date.now();
  state.failures++;

  if (state.state === 'HALF_OPEN') {
    // Transition back to OPEN on failure in HALF_OPEN
    state.state = 'OPEN';
    state.nextAttemptTime = Date.now() + config.halfOpenTime;
  } else if (state.state === 'CLOSED') {
    if (state.failures >= config.failureThreshold) {
      // Transition to OPEN
      state.state = 'OPEN';
      state.nextAttemptTime = Date.now() + config.halfOpenTime;
    }
  }
}

/**
 * Get circuit breaker status for all tools
 *
 * @param toolNames - List of tool names
 * @returns Status information
 */
export function getCircuitBreakerStatus(toolNames: string[]): Record<string, {
  state: CircuitState;
  failures: number;
  successes: number;
}> {
  const status: Record<string, { state: CircuitState; failures: number; successes: number }> = {};

  for (const name of toolNames) {
    const state = circuitBreakers.get(name);
    if (state) {
      status[name] = {
        state: state.state,
        failures: state.failures,
        successes: state.successes,
      };
    } else {
      status[name] = {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
      };
    }
  }

  return status;
}
