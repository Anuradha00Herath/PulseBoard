# PulseBoard

A real-time collaborative analytics platform built to demonstrate: WebSocket connection
management at scale, event-driven microservices with Kafka, CRDT-based collaborative
editing, and horizontal scalability patterns.

See [`docs/requirements.md`](docs/requirements.md) for the full requirements and
[`docs/tech-stack.md`](docs/tech-stack.md) / [`docs/sprint-plan.md`](docs/sprint-plan.md)
for architecture decisions and the build roadmap.

## Status: Sprint 0 — Setup

This is the project skeleton. Every service currently exposes only a `/health` endpoint
(or, for `aggregation-service`, a heartbeat log) to prove the infrastructure is wired
correctly end-to-end before real feature logic is added in Sprint 1+.

## Architecture (Sprint 0 skeleton)

```
                       ┌──────────────┐
                       │   frontend   │  (React + Vite, :5173)
                       └───────┬──────┘
                               │
        ┌──────────────┬──────┴───────┬───────────────┐
        ▼              ▼              ▼               
┌───────────────┐┌────────────────┐┌───────────┐
│ auth-service  ││ingestion-service││ws-gateway │
│    :4001      ││     :4002       ││   :4003   │
└───────┬───────┘└────────┬────────┘└─────┬─────┘
        │                 │                │
        ▼                 ▼                ▼
   ┌─────────┐       ┌────────┐      ┌─────────┐
   │ Postgres│       │ Kafka  │      │  Redis  │
   │(+Timescale)      └───┬────┘      └─────────┘
   └─────────┘            │
                           ▼
                  ┌─────────────────────┐
                  │ aggregation-service │ (background worker)
                  └─────────────────────┘
```

## Prerequisites

- Docker & Docker Compose
- Node.js 22.x (only needed if running a service outside Docker)

## Quickstart

```bash
git clone <this-repo>
cd pulseboard
docker-compose up --build
```

Then check:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| auth-service health | http://localhost:4001/health |
| ingestion-service health | http://localhost:4002/health |
| ws-gateway health | http://localhost:4003/health |
| Postgres | localhost:5432 (user/pass: `pulseboard`/`pulseboard`) |
| Redis | localhost:6379 |
| Kafka | localhost:9092 |

The frontend's homepage pings all three HTTP services and displays their health status —
that's the Sprint 0 "it's alive" proof.

## Repo structure

```
pulseboard/
├── docker-compose.yml
├── docs/                     # requirements, tech stack decisions, sprint plan
├── services/
│   ├── auth-service/
│   ├── ingestion-service/
│   ├── aggregation-service/  # background worker, no HTTP port
│   └── ws-gateway/
├── frontend/                 # React + Vite
└── .github/workflows/ci.yml  # lint + build stub for every service
```

## Roadmap

See [`docs/sprint-plan.md`](docs/sprint-plan.md). Sprint 1 adds real auth (JWT, roles)
and the Dashboard/Widget data model.
