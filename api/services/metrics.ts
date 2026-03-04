type Metric = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  revocationChecks: number;
  revocationGood: number;
  revocationRevoked: number;
  revocationErrors: number;
  revocationUnsupported: number;
  requestsByStatus: Record<string, number>;
  requestsByError: Record<string, number>;
  averageResponseTimeMs: number;
  totalResponseTimeMs: number;
};

let metrics: Metric = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  revocationChecks: 0,
  revocationGood: 0,
  revocationRevoked: 0,
  revocationErrors: 0,
  revocationUnsupported: 0,
  requestsByStatus: {},
  requestsByError: {},
  averageResponseTimeMs: 0,
  totalResponseTimeMs: 0
};

let startTime = Date.now();

export const resetMetrics = () => {
  metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    revocationChecks: 0,
    revocationGood: 0,
    revocationRevoked: 0,
    revocationErrors: 0,
    revocationUnsupported: 0,
    requestsByStatus: {},
    requestsByError: {},
    averageResponseTimeMs: 0,
    totalResponseTimeMs: 0
  };
  startTime = Date.now();
};

export const recordRequestStart = (): number => {
  metrics.totalRequests++;
  return Date.now();
};

export const recordRequestEnd = (startTime: number, isSuccess: boolean, statusCode?: number, error?: string) => {
  const responseTime = Date.now() - startTime;
  metrics.totalResponseTimeMs += responseTime;
  metrics.averageResponseTimeMs = metrics.totalResponseTimeMs / metrics.totalRequests;

  if (isSuccess) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
    if (error) {
      metrics.requestsByError[error] = (metrics.requestsByError[error] || 0) + 1;
    }
  }

  if (statusCode) {
    metrics.requestsByStatus[statusCode.toString()] = (metrics.requestsByStatus[statusCode.toString()] || 0) + 1;
  }
};

export const recordCacheHit = () => {
  metrics.cacheHits++;
};

export const recordCacheMiss = () => {
  metrics.cacheMisses++;
};

export const recordRevocationCheck = (status: string) => {
  metrics.revocationChecks++;
  switch (status) {
    case "good":
      metrics.revocationGood++;
      break;
    case "revoked":
      metrics.revocationRevoked++;
      break;
    case "error":
      metrics.revocationErrors++;
      break;
    case "unsupported":
    case "unknown":
      metrics.revocationUnsupported++;
      break;
  }
};

export const getMetrics = (): Metric & { uptimeSeconds: number; startedAt: string } => {
  return {
    ...metrics,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    startedAt: new Date(startTime).toISOString()
  };
};
