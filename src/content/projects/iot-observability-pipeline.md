---
title: IoT Observability Pipeline
tagline: Event-driven IoT telemetry with real-time stream enrichment
---

:::hero{cover="/media/covers/iot-observability-pipeline.webp" repo="https://github.com/jecaro094/iot-observability-pipeline" docs="https://jecaro094.github.io/tech-docs/projects/iot-observability-pipeline/"}
# IoT Observability Pipeline

Event-driven IoT telemetry with real-time stream enrichment
:::

## 📡 Context {#context}

Picture a large building 🏢 with hundreds of rooms, each full of sensors: cameras
📷 capturing frames and ambient-light sensors 💡 reporting the current lighting.
Every device speaks on its own schedule, and on its own.

This project is an **event-driven pipeline** that ingests all of those readings,
correlates them in real time — matching each camera frame with the latest light
reading for *its* room — and publishes a single enriched stream ready for
analytics 📊, dashboards, or alerting.

:::tip[Why it matters]
Raw sensor data is rarely useful on its own. A camera frame that also knows the
room was dark when it was taken is far more valuable. Doing that join **as the
data flows**, without a database in the middle, keeps latency low and the system
easy to scale.
:::

The system simulates a realistic load: **100 rooms × 5 cameras = 500 devices**
producing telemetry concurrently.

## 🔀 Explanation {#explanation}

### 🌟 High-Level Flow (Non-Technical)

:::flow
1. **📥 Trigger** — A single HTTP call kicks off a full round of device readings.
2. **📦 Fan-out** — The workload is split into 500 independent tasks, one per camera, and run in parallel.
3. **📨 Publish** — Each task emits its reading (a camera frame or a light-color update) as an event onto a streaming backbone.
4. **🧠 Correlate** — A stateful consumer remembers the latest light color for every room and attaches it to each incoming frame.
5. **✅ Enriched output** — The combined frame-plus-context payload is published to a final stream for downstream consumers.
:::

:::info[Want the full technical breakdown?]
The data flow, topic layout and design rationale for this pipeline are written up
in the [technical documentation](https://jecaro094.github.io/tech-docs/projects/iot-observability-pipeline/).
:::

## 🧱 Architecture {#architecture}

:::steps
1. **FastAPI** — Thin HTTP layer exposing the `POST /trigger` endpoint.
2. **Celery + Redis** — Distributed task queue; `group()` dispatches 500 camera tasks in parallel.
3. **Apache Kafka** — Event backbone: two input topics (`device.state`, `device.frames`) and one output topic (`enriched.telemetry.output`).
4. **Stream Enricher** — Stateful consumer holding a per-room light map in memory and correlating frames as they arrive.
5. **Docker Compose** — Orchestrates every service for a one-command local run.
:::

## Technologies {#technologies}

:::grid
### 🐍 Python 3.11

- FastAPI trigger API ⚡
- Celery distributed task queue
- `kafka-python` producers and consumer

### 📨 Apache Kafka

- Event streaming backbone
- Two input topics + one enriched output topic
- Replayable, decoupled stages

### 🧵 Celery + Redis

- `group()` fan-out across 500 camera tasks
- Redis as the message broker

### 🐳 Docker Compose

- FastAPI, Celery, Kafka, and Redis in one stack
- `docker-compose up --build` to run it all

### 🧪 pytest + coverage

- Unit tests for producers and the enricher
- 80%+ coverage target

### 👾 GitHub

- Version control
- `.env.example` template for configuration
:::

## Run it {#run}

:::repos
- https://github.com/jecaro094/iot-observability-pipeline
:::

## Documentation {#docs}

:::docs
- [IoT Observability Pipeline](https://jecaro094.github.io/tech-docs/projects/iot-observability-pipeline/)
:::
