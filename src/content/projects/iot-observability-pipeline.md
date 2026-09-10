---
title: IoT Observability Pipeline
tagline: Event-driven IoT telemetry with real-time stream enrichment
---

:::hero{cover="/media/covers/iot-observability-pipeline.webp"}
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

:::::details[🔧 Technical Details (For Developers)]
#### 🔄 Data Flow

::::steps
1. **Trigger endpoint**

   :::endpoints
   - `POST /trigger` — Dispatches a Celery `group()` of 500 camera tasks. Returns immediately; the work happens asynchronously.
   :::

2. **Parallel dispatch**

   Celery fans the work out across workers using `group()`, with **Redis** as the
   broker. Each task simulates one device and produces to Kafka.

3. **Input topics**

   :::endpoints
   - `telemetry.device.state` — Ambient-light readings (room → current light color).
   - `telemetry.device.frames` — Camera frames tagged with their room id.
   :::

4. **Stream enrichment**

   A stateful consumer (`StreamEnricher`) subscribes to both input topics. It
   keeps an **in-memory map of `room → latest light color`**, updated on every
   `device.state` event. For each `device.frames` event it looks up that room's
   current light and merges it into the payload.

5. **Enriched output**

   :::endpoints
   - `enriched.telemetry.output` — Frames enriched with per-room lighting context, ready for analytics.
   :::
::::

#### 🧭 Design Rationale

:::grid{variant="auth"}
### 📨 Why Kafka

Replayable log, high throughput, and clean producer–consumer decoupling. Each
stage can fail and catch up independently.

### 🧵 Why Celery `group()`

Turns one request into 500 parallel units of work without hand-rolling a thread
pool or a scheduler.

### 🧠 In-memory enrichment

Correlation state lives in the consumer, so there is no database on the hot path
— lower latency and one less thing to operate.

### 🐳 Docker Compose

FastAPI, Celery, Kafka, and Redis come up together with a single command, so the
whole pipeline is reproducible locally.
:::
:::::

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
