# PulseBoard — Project Context for Claude Code

This file is auto-loaded by Claude Code at the start of every session (terminal or
GitHub Action). It exists so you don't have to re-explain the project each time —
reference this file instead of retyping context.

## What this project is

A real-time collaborative analytics platform (like a mini Mixpanel/Datadog) built as a
portfolio project to demonstrate: WebSocket connection management at scale, event-driven
microservices with Kafka, CRDT-based collaborative editing, and horizontal scalability
patterns.

Full requirements: `docs/requirements.md`
Tech stack + rationale: `docs/tech-stack.md`
Sprint roadmap: `docs/sprint-plan.md`
Issue backlog (source of truth for scope): `docs/github_issues.csv`

## Current status

Sprint 0 complete: repo skeleton, docker-compose stack, CI stub, all services boot with
health checks. See README.md for the architecture diagram and quickstart.

**Do not skip ahead of the current sprint.** Check `docs/sprint-plan.md` for what sprint
is active and only implement issues belonging to that sprint unless explicitly told
otherwise — this project is intentionally built incrementally so each sprint stays
demoable.

## Architecture rules (do not deviate without discussion)

- Services are independent Node.js apps under `services/`, each with its own
  `package.json` and `Dockerfile`. Do not merge services back into a monolith.
- `ingestion-service` never writes directly to a DB — events go to Kafka only.
- `aggregation-service` is a background worker (no HTTP port). Consumption from Kafka
  must be idempotent (dedupe by `event_id`) — see FR6.
- `ws-gateway` must stay stateless. Any session/presence state goes in Redis, not
  in-process memory — this is required for FR19 (horizontal scaling).
- Collaborative dashboard editing uses CRDT (Yjs), never last-write-wins — see FR14.
- New tables/migrations go in `services/auth-service` (owns the Postgres schema for
  users/dashboards/widgets) unless a task says otherwise.

## Conventions

- ES modules (`type: "module"` in package.json), not CommonJS.
- Each service exposes `/health` returning `{ service, status, uptime }`.
- Commit messages reference the FR/issue number, e.g. `FR1: implement JWT login (closes #3)`.
- Every new package.json needs working `lint` and `test` scripts (stubs are fine until
  real tests exist, but they must exit 0 — CI depends on this).

## How to give this agent a task

Reference an issue number or FR directly, e.g.:

> Implement FR1 (#3) from docs/requirements.md — JWT signup/login in auth-service.
> Follow the conventions in this file. Open a PR when done, don't push to main directly.

If a task isn't in `docs/github_issues.csv` yet, say so explicitly — don't invent scope
that wasn't planned in a sprint.

## What NOT to do

- Don't add new services or infra (databases, queues) without flagging it — the stack is
  intentionally locked per `docs/tech-stack.md`.
- Don't jump to a later sprint's features "while you're in there."
- Don't remove the Sprint 0 health-check endpoints even after real features are added —
  they're used by the frontend's status page and by CI.
