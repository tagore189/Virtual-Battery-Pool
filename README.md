# GridPulse — Virtual Battery Pool Grid Stabilizer

Real-time grid stabilization platform that aggregates distributed battery assets into a virtual pool, orchestrates charge/discharge cycles via MQTT, and provides a live monitoring dashboard.

## Project Structure

```
├── backend/        # Node.js (Express) API + WebSocket server
├── frontend/       # React + Tailwind CSS + Recharts dashboard
├── simulator/      # Python (asyncio) battery & grid simulators
└── docker-compose.yml
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Node.js 18+
- Python 3.10+

## Quick Start — Infrastructure

Start the EMQX MQTT broker and InfluxDB:

```bash
docker compose up -d
```

| Service   | URL                          | Credentials              |
|-----------|------------------------------|--------------------------|
| MQTT      | `mqtt://localhost:1883`      | —                        |
| EMQX Dash | http://localhost:18083       | `admin` / `public`       |
| InfluxDB  | http://localhost:8086        | `admin` / `gridpulse123` |

InfluxDB is pre-configured with org `gridpulse`, bucket `telemetry`, and API token `gridpulse-dev-token`.

### Stop

```bash
docker compose down
```

### Reset (wipe volumes)

```bash
docker compose down -v
```
