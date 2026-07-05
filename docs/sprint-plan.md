# PulseBoard — Sprint Plan

2-week sprints, solo developer. ~9 sprints after Sprint 0 (~18-19 weeks total).

## Epics

| Epic | Covers |
|---|---|
| E1 – Foundation & Auth | FR1-3 |
| E2 – Ingestion Pipeline | FR4-6, FR20 |
| E3 – Real-Time Aggregation | FR7-9 |
| E4 – Live Dashboard (Read Path) | FR10-12 |
| E5 – Collaborative Editing | FR13-15 |
| E6 – Alerts & Notifications | FR16-17 |
| E7 – Resilience & Scaling | FR18-19, NFRs |
| E8 – Observability & Load Testing | Observability, Acceptance Criteria |

## Sprints

- **Sprint 0 (1 week):** repo structure, Compose skeleton, CI stub, requirements + tech
  stack finalized. Deliverable: `docker-compose up` boots every service. ← you are here
- **Sprint 1:** Auth & core data model (FR1, FR2, Dashboard/Widget CRUD)
- **Sprint 2:** Ingestion API + Kafka producer, rate limiting (FR4, FR5, FR20)
- **Sprint 3:** Idempotent consumer + windowed aggregation (FR6, FR7, FR9)
- **Sprint 4:** Redis caching + single-instance WebSocket push (FR8, FR10)
- **Sprint 5:** Dashboard widgets UI (FR11, FR12)
- **Sprint 6:** Horizontal WebSocket scaling via Redis pub/sub (FR19)
- **Sprint 7:** Collaborative editing with CRDT/Yjs (FR13-15)
- **Sprint 8:** Alerts + circuit breaker resilience (FR16-18)
- **Sprint 9:** Observability, load testing, hardening, final README/demo

## Ceremonies (solo-adapted)

- Planning: 15 min, pull issues into the sprint milestone
- Daily standup: replaced by disciplined commit messages
- Review: record a short demo clip at the end of each sprint
- Retro: 5-min note in `RETRO.md`
