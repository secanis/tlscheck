import { Counter } from 'prom-client';

export const tlsCheckTotal = new Counter({
  name: 'tls_check_total',
  help: 'Total number of TLS/SSL certificate checks performed',
  labelNames: ['status', 'valid']
});

export const tlsCheckDurationSeconds = new Counter({
  name: 'tls_check_duration_seconds_total',
  help: 'Total time spent performing TLS/SSL certificate checks'
});

export const revocationCheckTotal = new Counter({
  name: 'revocation_check_total',
  help: 'Total number of revocation checks performed',
  labelNames: ['status', 'source']
});

export const httpResponseStatusTotal = new Counter({
  name: 'http_response_status_total',
  help: 'Total number of HTTP responses by status code',
  labelNames: ['status_code', 'route']
});
