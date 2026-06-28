/**
 * OpenTelemetry stub.
 * Exports no-op tracer and meter so app code can import without crashing.
 * Replace with @opentelemetry/sdk-node for real distributed tracing.
 */

const noop = () => {}
const noopSpan = {
  setAttribute: noop, setStatus: noop, recordException: noop,
  addEvent: noop, end: noop,
}

export const tracer = {
  startSpan: (_name) => noopSpan,
  startActiveSpan: (_name, fn) => fn(noopSpan),
}

export const meter = {
  createCounter: (_name) => ({ add: noop }),
  createHistogram: (_name) => ({ record: noop }),
  createGauge: (_name) => ({ record: noop }),
}

export function initOtel({ serviceName = 'gta6-news-hub' } = {}) {
  console.log(`[otel] Stub tracer initialized for service "${serviceName}". Set OTEL_EXPORTER_OTLP_ENDPOINT for real tracing.`)
}
