# PulseBoard — Tech Stack Decisions

Locked at Sprint 0. Changing any of these mid-project should require a new decision record below, not a silent swap.

## Backend Language: Node.js

- **Why:** Fastest path to a working end-to-end system across REST APIs, WebSocket servers, and Kafka consumers. Mature client libraries for every piece we need (kafkajs, ioredis, ws/socket.io, pg).
- **Trade-off accepted:** Go would signal stronger systems programming, but Node lets us ship all 9 sprints solo without fighting the language for basic plumbing.
- **Version:** Node 22.x LTS, ES modules.

## Event Streaming: Apache Kafka

- **Why:** Industry-standard, most recognized on a resume, and the concepts (partitions, consumer groups, offsets, exactly-once semantics) transfer directly to interview questions.
- **Trade-off accepted:** Heavier to run locally than Redpanda (needs Zookeeper or KRaft mode + more memory). We mitigate this by running Kafka in KRaft mode (no separate Zookeeper container) to keep the Compose stack lighter.
- **Client library:** `kafkajs`

## Frontend: React + Vite

- **Why:** Fast dev server, minimal config, first-class support for the charting (Recharts) and CRDT (Yjs) libraries we'll need later.
- **State/collab:** Yjs + y-websocket provider (Sprint 7).

## Databases & Caching

| Concern | Choice | Why |
|---|---|---|
| Relational (users, dashboards, widgets, alerts) | PostgreSQL 16 | ACID, JSONB for flexible widget config, free, ubiquitous |
| Time-series aggregates | TimescaleDB (Postgres extension) | Avoids running a second DB engine; hypertables give us time-bucketed queries for free |
| Cache / Pub-Sub fan-out | Redis 7 | Sub-ms latency for hot aggregates; Pub/Sub used later for horizontal WebSocket scaling |

## Service Boundaries (Microservices)

| Service | Responsibility | Port (local) |
|---|---|---|
| `auth-service` | Signup/login, JWT issuance, role management | 4001 |
| `ingestion-service` | Accepts events via REST, validates, publishes to Kafka | 4002 |
| `aggregation-service` | Kafka consumer, windowed aggregation, writes to Timescale + Redis | (no HTTP port, background worker) |
| `ws-gateway` | Stateless WebSocket server, subscribes to Redis pub/sub, pushes live updates | 4003 |
| `frontend` | React dashboard UI | 5173 (Vite dev) |

Notification-service and alert-evaluator are deferred to Sprint 8 and will be added as a new service folder at that point — not scaffolded now to avoid dead code sitting unused for 7 sprints.

## Infra / Local Dev

- **Orchestration:** Docker Compose for local dev (single `docker-compose up` boots everything)
- **CI:** GitHub Actions — lint + build stub in Sprint 0, test execution added as each service gets tests
- **Load testing (Sprint 9):** k6

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| Sprint 0 | Node.js over Go | Solo dev velocity across 9 sprints |
| Sprint 0 | Kafka (KRaft mode) over Redpanda | Resume recognition; KRaft avoids extra Zookeeper container |
| Sprint 0 | Postgres+Timescale over separate ClickHouse | One DB engine to operate instead of two |
