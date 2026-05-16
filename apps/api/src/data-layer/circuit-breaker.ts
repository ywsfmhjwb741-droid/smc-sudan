// ============================================================
// Circuit Breaker Pattern Implementation
// ============================================================

import type { DataSource, CircuitBreakerState } from "@smc/types";

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenMaxCalls: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  halfOpenMaxCalls: 3,
};

export class CircuitBreaker {
  private state: CircuitBreakerState = "closed";
  private failureCount = 0;
  private successCount = 0;
  private consecutiveFailures = 0;
  private lastFailureAt: Date | null = null;
  private lastSuccessAt: Date | null = null;
  private halfOpenCallCount = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(
    public readonly source: DataSource,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get currentState(): CircuitBreakerState {
    return this.state;
  }

  get isAvailable(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open") {
      // Check if recovery timeout has passed
      if (
        this.lastFailureAt &&
        Date.now() - this.lastFailureAt.getTime() > this.config.recoveryTimeout
      ) {
        this.transitionTo("half-open");
        return true;
      }
      return false;
    }
    // half-open: allow limited calls
    return this.halfOpenCallCount < this.config.halfOpenMaxCalls;
  }

  get reliabilityScore(): number {
    const total = this.successCount + this.failureCount;
    if (total === 0) return 100;
    return Math.round((this.successCount / total) * 100);
  }

  recordSuccess(): void {
    this.successCount++;
    this.consecutiveFailures = 0;
    this.lastSuccessAt = new Date();

    if (this.state === "half-open") {
      this.halfOpenCallCount++;
      if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        this.transitionTo("closed");
      }
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.consecutiveFailures++;
    this.lastFailureAt = new Date();

    if (this.state === "half-open") {
      this.transitionTo("open");
      return;
    }

    if (
      this.state === "closed" &&
      this.consecutiveFailures >= this.config.failureThreshold
    ) {
      this.transitionTo("open");
    }
  }

  getMetrics() {
    return {
      source: this.source,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureAt: this.lastFailureAt,
      lastSuccessAt: this.lastSuccessAt,
      reliabilityScore: this.reliabilityScore,
    };
  }

  private transitionTo(newState: CircuitBreakerState): void {
    this.state = newState;
    if (newState === "half-open") {
      this.halfOpenCallCount = 0;
    }
    if (newState === "closed") {
      this.consecutiveFailures = 0;
      this.halfOpenCallCount = 0;
    }
  }
}
