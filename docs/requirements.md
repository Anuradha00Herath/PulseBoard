# PulseBoard — Requirements

## 1. Scope

**In scope:** real-time analytics ingestion, live dashboard visualization, collaborative
dashboard editing, horizontal scalability, resilience patterns.

**Out of scope (v1):** enterprise multi-tenancy/billing, ML-based anomaly detection,
mobile apps, full RBAC hierarchy. Tracked as future work.

## 2. Actors

| Actor | Description |
|---|---|
| Viewer | Watches live dashboards, no edit rights |
| Editor | Creates/edits dashboards, widgets, layouts |
| Admin | Manages users, API keys, data sources |
| Service Account | External apps pushing events via ingestion API |

## 3. Functional Requirements

**Auth & Authorization**
- FR1: Sign up / log in (JWT-based)
- FR2: Role-based access (Viewer/Editor/Admin) per dashboard
- FR3: Service accounts get API keys for ingestion, separate from user auth

**Event Ingestion**
- FR4: Accept events via REST POST (event name, payload, timestamp, source)
- FR5: Validate and queue events onto Kafka (not written synchronously to DB)
- FR6: At-least-once delivery from client; exactly-once processing (idempotent consumers)

**Real-Time Aggregation**
- FR7: Rolling aggregates (count/avg/sum) over configurable windows (1m/5m/1h)
- FR8: Aggregates cached in Redis for low-latency reads
- FR9: Historical aggregates persisted to Timescale for later querying

**Live Dashboard**
- FR10: Live metric updates via WebSocket push, no refresh
- FR11: Multiple widget types (line chart, counter, bar chart, table)
- FR12: Add/configure widgets (metric, chart type, time range)

**Collaborative Editing**
- FR13: Multiple users edit the same dashboard layout concurrently
- FR14: Conflicting edits resolve deterministically, no data loss (CRDT)
- FR15: Presence indicators for active editors

**Notifications**
- FR16: Threshold alerts (e.g. error_rate > 5%)
- FR17: Alert breaches trigger in-app (+ optional email/webhook) notification

**Resilience / Ops**
- FR18: Ingestion keeps accepting events if aggregation service is down (Kafka buffers)
- FR19: WS gateway instance death doesn't lose client dashboard state (reconnect elsewhere)
- FR20: Rate limiting on ingestion API per API key

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | ≥5,000 events/sec ingest on a single node; <500ms end-to-end update latency |
| Scalability | WS layer scales horizontally (stateless gateway + Redis pub/sub fan-out) |
| Availability | No single point of failure in the event path |
| Consistency | Eventually consistent aggregates within one window; exactly-once counts |
| Concurrency | ≥500 concurrent WS connections per gateway instance |
| Data Retention | Raw events 7 days (Kafka); aggregates indefinite/configurable |
| Security | TLS everywhere; API keys hashed at rest; input validation on ingestion |
| Observability | Structured logs, metrics, tracing across services |
| Fault Tolerance | Circuit breaker on inter-service calls; retry with backoff |

## 5. Data Requirements

- **Users** — id, email, password_hash, role
- **Dashboards** — id, owner_id, layout_json, created_at
- **Widgets** — id, dashboard_id, type, metric_query, position
- **Events** (Kafka topic) — event_name, source, payload, timestamp, event_id
- **Aggregates** — metric_name, window_start, window_size, value
- **Alerts** — id, dashboard_id, metric, condition, threshold

## 6. Architectural Constraints

- Ingestion decoupled from processing via Kafka
- WS servers stateless — session/presence state lives in Redis
- Collaborative editing uses CRDT/OT, not last-write-wins
- Aggregation is idempotent — safe to reprocess on consumer restart

## 7. Acceptance Criteria

- Load test: 5k events/sec for 10 min, zero data loss, <1% duplicate counts
- Kill one WS gateway instance mid-session → clients reconnect within 3s, no state loss
- Two users edit the same widget concurrently → both converge to the same final state
- Ingestion API returns 429 above 100 req/sec from a single API key
